@echo off
REM ─────────────────────────────────────────────────────────────────
REM UMBRIS · Custos Console launcher
REM
REM Double-click this file (or pin it to your taskbar) to open the
REM Custos Console. The console window lets you Start / Stop the
REM autonomous convocation and watch the live conversation feed.
REM
REM The pythonw.exe path keeps the launcher silent · no extra
REM terminal window pops up alongside the GUI.
REM ─────────────────────────────────────────────────────────────────

cd /d "%~dp0.."

if exist ".venv\Scripts\pythonw.exe" (
    start "" ".venv\Scripts\pythonw.exe" "console\custos_console.py"
) else if exist ".venv\Scripts\python.exe" (
    start "" ".venv\Scripts\python.exe" "console\custos_console.py"
) else (
    echo ERROR · could not find Python in .venv. Run:
    echo   cd umbris-core
    echo   python -m venv .venv
    echo   .venv\Scripts\activate
    echo   pip install -e ".[serve]"
    pause
)
