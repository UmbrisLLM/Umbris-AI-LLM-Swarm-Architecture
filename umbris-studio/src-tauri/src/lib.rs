// UMBRIS Studio · Tauri library entrypoint.
//
// Phase 1A: spawns the `umbris serve` Python sidecar on startup, exposes
// the port to the frontend via Tauri commands, kills the sidecar on
// window close.

mod sidecar;

use sidecar::{ensure_sidecar, shutdown_sidecar, AppState};
use serde::Serialize;
use tauri::{Manager, RunEvent, WindowEvent};

// ─────────────────────────────────────────────────────────────────
// Tauri commands · the IPC surface the frontend calls
// ─────────────────────────────────────────────────────────────────

#[derive(Serialize)]
pub struct EngineStatus {
    pub ready: bool,
    pub port: Option<u16>,
    pub base_url: Option<String>,
    pub error: Option<String>,
}

#[tauri::command]
fn studio_ping() -> &'static str {
    "the convocation hears you."
}

#[tauri::command]
fn engine_status(state: tauri::State<'_, AppState>) -> EngineStatus {
    let guard = state.sidecar.lock().unwrap();
    match guard.as_ref() {
        Some(sc) => EngineStatus {
            ready: true,
            port: Some(sc.port),
            base_url: Some(format!("http://127.0.0.1:{}", sc.port)),
            error: None,
        },
        None => EngineStatus { ready: false, port: None, base_url: None, error: None },
    }
}

#[tauri::command]
fn engine_port(state: tauri::State<'_, AppState>) -> Result<u16, String> {
    let guard = state.sidecar.lock().unwrap();
    guard.as_ref().map(|sc| sc.port).ok_or_else(|| "sidecar not running".into())
}

/// Force-boot the sidecar synchronously. Called from RootLayout on first
/// mount if the engine isn't already up.
#[tauri::command]
fn engine_boot(state: tauri::State<'_, AppState>) -> Result<u16, String> {
    ensure_sidecar(state.inner())
}

// ─────────────────────────────────────────────────────────────────
// Entrypoint
// ─────────────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            studio_ping,
            engine_status,
            engine_port,
            engine_boot,
        ])
        .setup(|app| {
            // Spawn the sidecar on a background thread so the window
            // appears immediately. The frontend polls engine_status
            // until it sees ready=true.
            let handle = app.handle().clone();
            std::thread::spawn(move || {
                let state = handle.state::<AppState>();
                if let Err(e) = ensure_sidecar(&state) {
                    eprintln!("[umbris-studio] sidecar boot failed: {e}");
                }
            });
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building UMBRIS Studio");

    app.run(|app_handle, event| match event {
        RunEvent::Exit | RunEvent::ExitRequested { .. } => {
            let state = app_handle.state::<AppState>();
            shutdown_sidecar(&state);
        }
        RunEvent::WindowEvent { event: WindowEvent::CloseRequested { .. }, .. } => {
            let state = app_handle.state::<AppState>();
            shutdown_sidecar(&state);
        }
        _ => {}
    });
}
