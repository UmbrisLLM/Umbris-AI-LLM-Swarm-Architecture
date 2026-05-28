"""
UMBRIS · Custos Console

A minimal desktop launcher for the autonomous Custos sentinel. Two
buttons (Start / Stop), a status header, and a live scrolling feed of
the convocation's conversation as each cycle's voices land in
`lore/revolutions/auto/manifest.json`.

Single file. Standard library only (tkinter). Runs from the
umbris-core venv. No Tauri build, no Node, no GUI framework
dependencies beyond what ships with Python on Windows.

Launch:

    .venv\\Scripts\\python.exe console/custos_console.py
"""

from __future__ import annotations

import json
import os
import queue
import signal
import subprocess
import sys
import threading
import time
import tkinter as tk
import tkinter.font as tkfont
from pathlib import Path
from tkinter import scrolledtext
from typing import Optional

# ──────────────────────────────────────────────────────────────────
# Brand
# ──────────────────────────────────────────────────────────────────

VOID    = "#000000"
LUNAR   = "#DCDEE7"
STELLAR = "#8B90A3"
GREY    = "#4A4D5C"
VIOLET  = "#9C7BD9"
CORONA  = "#FAE6B0"


# ──────────────────────────────────────────────────────────────────
# Paths · resolve repo root + transcript dir
# ──────────────────────────────────────────────────────────────────

CONSOLE_DIR = Path(__file__).resolve().parent
UMBRIS_CORE = CONSOLE_DIR.parent
REPO_ROOT   = UMBRIS_CORE.parent
TRANSCRIPT_DIR = REPO_ROOT / "lore" / "revolutions" / "auto"
MANIFEST_PATH  = TRANSCRIPT_DIR / "manifest.json"


# ──────────────────────────────────────────────────────────────────
# Daemon runner · subprocess that wraps `umbris custos --interval 20m`
# ──────────────────────────────────────────────────────────────────


class DaemonRunner:
    """Wraps the umbris custos subprocess."""

    def __init__(self) -> None:
        self._proc: Optional[subprocess.Popen] = None
        self._log_q: "queue.Queue[str]" = queue.Queue()

    def is_running(self) -> bool:
        return self._proc is not None and self._proc.poll() is None

    def start(self, interval: str = "20m") -> None:
        if self.is_running():
            return

        umbris_exe = UMBRIS_CORE / ".venv" / "Scripts" / "umbris.exe"
        if not umbris_exe.exists():
            self._log_q.put(
                "ERROR · umbris.exe not found at "
                f"{umbris_exe}. Install with: pip install -e \".[serve]\""
            )
            return

        # CREATE_NO_WINDOW · keeps the daemon's terminal hidden.
        creation = 0
        if sys.platform == "win32":
            creation = subprocess.CREATE_NO_WINDOW  # type: ignore[attr-defined]

        env = os.environ.copy()
        env.setdefault("UMBRIS_PROVIDER", "ollama")

        self._proc = subprocess.Popen(
            [
                str(umbris_exe),
                "custos",
                "--interval", interval,
                "--repo", str(REPO_ROOT),
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            creationflags=creation,
            env=env,
        )

        # Pump stdout into the log queue from a background thread.
        threading.Thread(target=self._pump_output, daemon=True).start()
        self._log_q.put(f"Custos started · interval {interval} · pid {self._proc.pid}")

    def stop(self) -> None:
        if not self.is_running() or self._proc is None:
            return
        try:
            if sys.platform == "win32":
                # Graceful SIGTERM equivalent on Windows.
                self._proc.terminate()
            else:
                self._proc.send_signal(signal.SIGTERM)
        except Exception as e:
            self._log_q.put(f"ERROR while stopping: {e!r}")
            return
        # Give it 8 seconds to clean up, then kill.
        try:
            self._proc.wait(timeout=8)
        except subprocess.TimeoutExpired:
            self._proc.kill()
        self._log_q.put("Custos stopped.")

    def drain_log(self) -> list[str]:
        out: list[str] = []
        try:
            while True:
                out.append(self._log_q.get_nowait())
        except queue.Empty:
            pass
        return out

    def _pump_output(self) -> None:
        if self._proc is None or self._proc.stdout is None:
            return
        for line in self._proc.stdout:
            if line:
                self._log_q.put(line.rstrip())


# ──────────────────────────────────────────────────────────────────
# Manifest poller · polls manifest.json + emits new voices
# ──────────────────────────────────────────────────────────────────


class ManifestPoller:
    """Polls manifest.json on a short interval; emits new voices."""

    def __init__(self) -> None:
        self._last_cycle: Optional[int] = None
        self._last_count: int = 0

    def poll(self) -> tuple[Optional[dict], list[dict]]:
        """Return (latest_summary_dict, new_voices)."""
        try:
            m = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        except Exception:
            return None, []

        latest = m.get("latest", {}) or {}
        cycle = latest.get("cycle")
        voices = latest.get("voices", []) or []

        new_voices: list[dict] = []
        if cycle != self._last_cycle:
            # New cycle · show all of its voices.
            self._last_cycle = cycle
            self._last_count = 0
            new_voices = list(voices)
        else:
            # Same cycle · only emit voices we haven't shown yet.
            if len(voices) > self._last_count:
                new_voices = voices[self._last_count:]

        self._last_count = len(voices)
        return latest, new_voices


# ──────────────────────────────────────────────────────────────────
# Tkinter app
# ──────────────────────────────────────────────────────────────────


class CustosConsole(tk.Tk):
    """The whole app."""

    def __init__(self) -> None:
        super().__init__()
        self.title("UMBRIS · Custos Console")
        self.geometry("960x640")
        self.minsize(720, 480)
        self.configure(bg=VOID)

        # Fonts · fall back gracefully if Consolas isn't available
        self._font_display = tkfont.Font(family="Segoe UI", size=20, weight="bold")
        self._font_eyebrow = tkfont.Font(family="Consolas", size=8)
        self._font_body    = tkfont.Font(family="Segoe UI", size=11)
        self._font_mono    = tkfont.Font(family="Consolas", size=9)
        self._font_sigil   = tkfont.Font(family="Segoe UI Symbol", size=14)

        self._runner   = DaemonRunner()
        self._poller   = ManifestPoller()

        self._build_layout()
        self._refresh_status()
        self._tick()  # start the polling loop

        self.protocol("WM_DELETE_WINDOW", self._on_close)

    # ─── Layout ──────────────────────────────────────────────────

    def _build_layout(self) -> None:
        # Header
        header = tk.Frame(self, bg=VOID, padx=24, pady=18)
        header.pack(fill="x")

        tk.Label(
            header,
            text="— § THE CUSTOS · MMXXVI —",
            font=self._font_eyebrow,
            fg=VIOLET,
            bg=VOID,
        ).pack(anchor="w")

        tk.Label(
            header,
            text="UMBRIS",
            font=self._font_display,
            fg=LUNAR,
            bg=VOID,
        ).pack(anchor="w")

        tk.Label(
            header,
            text="the convocation's autonomous sentinel · hands off",
            font=self._font_body,
            fg=STELLAR,
            bg=VOID,
        ).pack(anchor="w")

        # Status + buttons row
        ctrl = tk.Frame(self, bg=VOID, padx=24, pady=12)
        ctrl.pack(fill="x")

        self._status_var = tk.StringVar(value="● stopped")
        tk.Label(
            ctrl,
            textvariable=self._status_var,
            font=self._font_body,
            fg=STELLAR,
            bg=VOID,
            width=24,
            anchor="w",
        ).pack(side="left")

        self._cycle_var = tk.StringVar(value="cycle —  ·  last —  ·  $0.0000")
        tk.Label(
            ctrl,
            textvariable=self._cycle_var,
            font=self._font_mono,
            fg=GREY,
            bg=VOID,
            anchor="w",
        ).pack(side="left", padx=12)

        # Buttons go on the right
        self._stop_btn = tk.Button(
            ctrl,
            text="STOP",
            font=self._font_eyebrow,
            command=self._on_stop,
            bg=VOID,
            fg=GREY,
            activebackground=VOID,
            activeforeground=LUNAR,
            relief="solid",
            bd=1,
            padx=18,
            pady=8,
            cursor="hand2",
            state="disabled",
        )
        self._stop_btn.pack(side="right", padx=(8, 0))

        self._start_btn = tk.Button(
            ctrl,
            text="START CUSTOS",
            font=self._font_eyebrow,
            command=self._on_start,
            bg=VOID,
            fg=VIOLET,
            activebackground=VIOLET,
            activeforeground=VOID,
            relief="solid",
            bd=1,
            padx=18,
            pady=8,
            cursor="hand2",
            highlightbackground=VIOLET,
        )
        self._start_btn.pack(side="right")

        # Separator hairline
        sep = tk.Frame(self, height=1, bg=GREY)
        sep.pack(fill="x", padx=24, pady=(8, 0))

        # Conversation panel
        feed_frame = tk.Frame(self, bg=VOID, padx=24, pady=12)
        feed_frame.pack(fill="both", expand=True)

        tk.Label(
            feed_frame,
            text="— THE CONVOCATION SPEAKS —",
            font=self._font_eyebrow,
            fg=VIOLET,
            bg=VOID,
        ).pack(anchor="w", pady=(0, 6))

        self._feed = scrolledtext.ScrolledText(
            feed_frame,
            bg=VOID,
            fg=LUNAR,
            insertbackground=VIOLET,
            selectbackground=VIOLET,
            selectforeground=VOID,
            relief="flat",
            wrap="word",
            padx=12,
            pady=12,
            font=self._font_body,
        )
        self._feed.pack(fill="both", expand=True)
        # Tag styles for the feed text
        self._feed.tag_configure("sigil",   foreground=VIOLET, font=self._font_sigil)
        self._feed.tag_configure("name",    foreground=LUNAR,  font=self._font_eyebrow)
        self._feed.tag_configure("meta",    foreground=GREY,   font=self._font_mono)
        self._feed.tag_configure("voice",   foreground=LUNAR,  font=self._font_body)
        self._feed.tag_configure("system",  foreground=STELLAR, font=self._font_mono)
        self._feed.tag_configure("cycle",   foreground=VIOLET, font=self._font_eyebrow)
        self._feed.configure(state="disabled")

        # Footer hint
        footer = tk.Frame(self, bg=VOID, padx=24, pady=10)
        footer.pack(fill="x")
        tk.Label(
            footer,
            text="ex umbris in lumen · revolutions live at lore/revolutions/auto",
            font=self._font_eyebrow,
            fg=GREY,
            bg=VOID,
        ).pack(anchor="w")

    # ─── Button handlers ─────────────────────────────────────────

    def _on_start(self) -> None:
        self._append_system("Starting the convocation.")
        self._runner.start(interval="20m")
        self._refresh_status()

    def _on_stop(self) -> None:
        self._append_system("Stopping the convocation. Current cycle will finish first.")
        self._runner.stop()
        self._refresh_status()

    def _on_close(self) -> None:
        try:
            self._runner.stop()
        except Exception:
            pass
        self.destroy()

    # ─── Status + ticking ────────────────────────────────────────

    def _refresh_status(self) -> None:
        if self._runner.is_running():
            self._status_var.set("● running")
            self._start_btn.configure(state="disabled", fg=GREY)
            self._stop_btn.configure(state="normal", fg=VIOLET, highlightbackground=VIOLET)
        else:
            self._status_var.set("● stopped")
            self._start_btn.configure(state="normal", fg=VIOLET, highlightbackground=VIOLET)
            self._stop_btn.configure(state="disabled", fg=GREY)

    def _tick(self) -> None:
        # Drain daemon stdout into the feed as system lines.
        for line in self._runner.drain_log():
            self._append_system(line)

        # Poll the manifest for any new voices.
        latest, new_voices = self._poller.poll()
        if latest:
            cyc    = latest.get("cycle", "?")
            status = latest.get("status", "?")
            cost   = latest.get("cost_usd", 0.0) or 0.0
            self._cycle_var.set(
                f"cycle {cyc}  ·  status: {status}  ·  ${cost:.4f}"
            )
            if new_voices and len(new_voices) == len(latest.get("voices", []) or []):
                # First time we're seeing this cycle · print a divider header.
                self._append_cycle_header(latest)

        for v in new_voices:
            self._append_voice(v)

        self._refresh_status()
        self.after(1500, self._tick)

    # ─── Feed writers ────────────────────────────────────────────

    def _append_system(self, line: str) -> None:
        self._feed.configure(state="normal")
        self._feed.insert("end", f"· {line}\n", "system")
        self._feed.see("end")
        self._feed.configure(state="disabled")

    def _append_cycle_header(self, latest: dict) -> None:
        cyc    = latest.get("cycle", "?")
        status = latest.get("status", "?")
        verdict = (latest.get("verdict") or "").strip()
        verdict_short = (verdict[:140] + "…") if len(verdict) > 140 else verdict

        self._feed.configure(state="normal")
        self._feed.insert("end", "\n")
        self._feed.insert("end", f"— REVOLUTION {cyc:04d} · {status.upper()} —\n", "cycle")
        if verdict_short:
            self._feed.insert("end", f"verdict · {verdict_short}\n", "meta")
        self._feed.insert("end", "\n")
        self._feed.see("end")
        self._feed.configure(state="disabled")

    def _append_voice(self, v: dict) -> None:
        sigil = v.get("sigil", "·")
        name  = (v.get("name") or "?").upper()
        descr = v.get("descriptor", "")
        rtype = v.get("type", "")
        conf  = v.get("confidence", 0.0) or 0.0
        voice = (v.get("voice") or "").strip()
        if not voice:
            return

        self._feed.configure(state="normal")
        self._feed.insert("end", f"{sigil}  ", "sigil")
        self._feed.insert("end", f"{name}", "name")
        meta = f"  · {descr}  · {rtype}  · {conf:.2f}\n" if descr else f"  · {rtype}  · {conf:.2f}\n"
        self._feed.insert("end", meta, "meta")
        self._feed.insert("end", f"{voice}\n\n", "voice")
        self._feed.see("end")
        self._feed.configure(state="disabled")


# ──────────────────────────────────────────────────────────────────
# Entry point
# ──────────────────────────────────────────────────────────────────


def main() -> None:
    app = CustosConsole()
    app.mainloop()


if __name__ == "__main__":
    main()
