#[cfg(all(feature = "desktop-e2e", not(debug_assertions)))]
compile_error!("desktop-e2e must never be included in release builds");

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            if option_env!("DESKTOP_UPDATER_ENABLED") == Some("Y") {
                app.handle()
                    .plugin(tauri_plugin_updater::Builder::new().build())?;
            }
            Ok(())
        });
    #[cfg(feature = "desktop-e2e")]
    let builder = builder.plugin(tauri_plugin_wdio_webdriver::init());
    builder
        .run(tauri::generate_context!())
        .expect("error while running desktop application");
}
