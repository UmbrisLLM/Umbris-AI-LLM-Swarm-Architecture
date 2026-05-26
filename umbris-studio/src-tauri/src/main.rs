// UMBRIS Studio · Tauri main entrypoint.
//
// Prevents an extra terminal window on Windows in release builds.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    umbris_studio_lib::run();
}
