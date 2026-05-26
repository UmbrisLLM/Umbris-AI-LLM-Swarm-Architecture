// UMBRIS Studio · Python sidecar lifecycle.
//
// Spawns `umbris serve` as a child process on a free local port, exposes
// the port to the frontend, and ensures the process dies when Tauri
// exits. The WebView talks to the sidecar directly over loopback HTTP
// for queries and SSE streams.

use std::net::TcpListener;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::thread;
use std::time::{Duration, Instant};

pub struct Sidecar {
    pub port: u16,
    pub child: Child,
}

/// Pick a random free TCP port by binding port 0 and reading the OS-assigned port.
pub fn pick_free_port() -> Result<u16, String> {
    let listener = TcpListener::bind("127.0.0.1:0")
        .map_err(|e| format!("could not bind: {e}"))?;
    let port = listener
        .local_addr()
        .map_err(|e| format!("could not get local addr: {e}"))?
        .port();
    Ok(port)
}

/// Resolve which Python executable to invoke.
///
/// Resolution order:
///   1. Bundled portable runtime at `python/runtime/python.exe` next to
///      the app exe (distribution mode, Phase 5).
///   2. The UMBRIS dev venv at `<repo>/umbris-core/.venv/{Scripts|bin}/python`
///      where `umbris-core` is installed via `pip install -e ".[serve]"`.
///      This is the path most developers will use during `tauri:dev`.
///   3. `python` / `python3` on PATH (last-resort fallback; will fail with
///      "No module named 'umbris'" unless the user has pip-installed
///      umbris-core globally).
pub fn resolve_python() -> String {
    use std::path::PathBuf;

    // (1) Bundled runtime: relative to the current exe.
    if let Ok(exe) = std::env::current_exe() {
        if let Some(dir) = exe.parent() {
            let bundled = if cfg!(windows) {
                dir.join("python").join("runtime").join("python.exe")
            } else {
                dir.join("python").join("runtime").join("bin").join("python")
            };
            if bundled.exists() {
                return bundled.to_string_lossy().into_owned();
            }
        }
    }

    // (2) Dev venv at <repo>/umbris-core/.venv. Walk up from CWD looking
    //     for an `umbris-core/.venv` next to a sibling `umbris-studio/`.
    let mut here: PathBuf = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    for _ in 0..6 {
        let candidate = if cfg!(windows) {
            here.join("umbris-core").join(".venv").join("Scripts").join("python.exe")
        } else {
            here.join("umbris-core").join(".venv").join("bin").join("python")
        };
        if candidate.exists() {
            return candidate.to_string_lossy().into_owned();
        }
        // Also try one level up (handles being invoked from umbris-studio/).
        if !here.pop() {
            break;
        }
    }

    // (3) System python · best-effort fallback.
    if cfg!(windows) { "python".to_string() } else { "python3".to_string() }
}

/// Spawn `umbris serve` on the chosen port, returning the Child.
/// stdout/stderr are inherited so logs flow to the terminal that
/// launched Tauri (handy for dev).
pub fn spawn_sidecar(python_exe: &str, port: u16) -> Result<Child, String> {
    let mut cmd = Command::new(python_exe);
    cmd.args([
        "-m", "umbris.cli", "serve",
        "--host", "127.0.0.1",
        "--port", &port.to_string(),
        "--no-browser",
    ])
    .stdout(Stdio::inherit())
    .stderr(Stdio::inherit());

    cmd.spawn()
        .map_err(|e| format!("failed to spawn umbris serve: {e}"))
}

/// Block until `GET http://127.0.0.1:<port>/api/status` returns 200, up
/// to `timeout_seconds`. Polls every 200ms. Returns Ok on success, Err
/// with a reason on timeout.
pub fn wait_for_ready(port: u16, timeout_seconds: u64) -> Result<(), String> {
    let url = format!("http://127.0.0.1:{port}/api/status");
    let deadline = Instant::now() + Duration::from_secs(timeout_seconds);

    while Instant::now() < deadline {
        // Use the std library · no extra deps needed for a tiny GET.
        if let Ok(stream) = std::net::TcpStream::connect_timeout(
            &format!("127.0.0.1:{port}").parse().unwrap(),
            Duration::from_millis(500),
        ) {
            // Port is open; try the actual HTTP request for proper 200.
            drop(stream);
            if let Ok(_) = ureq_get_ok(&url) {
                return Ok(());
            }
        }
        thread::sleep(Duration::from_millis(200));
    }
    Err(format!("sidecar did not respond on port {port} within {timeout_seconds}s"))
}

/// Minimal HTTP GET that returns Ok(()) iff the server responds with a
/// 2xx status. Implemented in std to avoid pulling in an HTTP crate.
fn ureq_get_ok(url: &str) -> Result<(), String> {
    use std::io::{Read, Write};
    // Parse `http://host:port/path`
    let stripped = url.strip_prefix("http://").ok_or("not http://")?;
    let (authority, path) = match stripped.find('/') {
        Some(i) => (&stripped[..i], &stripped[i..]),
        None => (stripped, "/"),
    };
    let addr: std::net::SocketAddr = authority
        .parse()
        .map_err(|e| format!("bad authority {authority}: {e}"))?;
    let mut stream = std::net::TcpStream::connect_timeout(&addr, Duration::from_secs(2))
        .map_err(|e| format!("connect: {e}"))?;
    stream.set_read_timeout(Some(Duration::from_secs(2))).ok();
    let req = format!(
        "GET {path} HTTP/1.1\r\nHost: {authority}\r\nConnection: close\r\n\r\n"
    );
    stream.write_all(req.as_bytes()).map_err(|e| format!("write: {e}"))?;
    let mut buf = Vec::with_capacity(256);
    stream.read_to_end(&mut buf).map_err(|e| format!("read: {e}"))?;
    let head = std::str::from_utf8(&buf[..buf.len().min(64)]).unwrap_or("");
    if head.contains("HTTP/1.1 2") || head.contains("HTTP/1.0 2") {
        Ok(())
    } else {
        Err(format!("non-2xx: {head}"))
    }
}

/// Shared application state held inside Tauri's State container.
pub struct AppState {
    pub sidecar: Mutex<Option<Sidecar>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self { sidecar: Mutex::new(None) }
    }
}

/// Try to spawn the sidecar and bring it up to ready. Stores the
/// resulting Sidecar inside AppState. Idempotent: returns Ok if a
/// sidecar is already running.
pub fn ensure_sidecar(state: &AppState) -> Result<u16, String> {
    let mut guard = state.sidecar.lock().unwrap();
    if let Some(sc) = guard.as_ref() {
        return Ok(sc.port);
    }
    let port = pick_free_port()?;
    let python = resolve_python();
    let child = spawn_sidecar(&python, port)?;
    *guard = Some(Sidecar { port, child });
    drop(guard);
    // Release the lock before the blocking wait so other callers can
    // observe the spawn even before it's ready.
    match wait_for_ready(port, 20) {
        Ok(_) => Ok(port),
        Err(e) => {
            // If the sidecar didn't come up, kill the child and surface.
            let mut guard = state.sidecar.lock().unwrap();
            if let Some(mut sc) = guard.take() {
                let _ = sc.child.kill();
            }
            Err(e)
        }
    }
}

/// Kill the sidecar process and clear AppState. Called on app exit.
pub fn shutdown_sidecar(state: &AppState) {
    let mut guard = state.sidecar.lock().unwrap();
    if let Some(mut sc) = guard.take() {
        let _ = sc.child.kill();
        let _ = sc.child.wait();
    }
}
