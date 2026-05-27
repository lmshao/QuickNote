#[tauri::command]
fn minimize_window(window: tauri::Window) {
    window.minimize().unwrap();
}

#[tauri::command]
fn close_window(window: tauri::Window) {
    window.close().unwrap();
}

#[tauri::command]
fn toggle_always_on_top(window: tauri::Window, on_top: bool) {
    window.set_always_on_top(on_top).unwrap();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            minimize_window,
            close_window,
            toggle_always_on_top
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
