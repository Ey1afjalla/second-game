use serde_json::json;
use tauri::{
  menu::{MenuBuilder, SubmenuBuilder},
  Emitter,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      let file_menu = SubmenuBuilder::new(app, "文件")
        .text("desktop-export-snapshot", "导出演示快照")
        .text("desktop-reset-demo", "重置本地演示")
        .separator()
        .text("desktop-refresh", "刷新窗口")
        .text("desktop-quit", "退出应用")
        .build()?;

      let view_menu = SubmenuBuilder::new(app, "视图")
        .text("desktop-tab-game", "游戏")
        .text("desktop-tab-ops", "运营")
        .text("desktop-tab-agent", "Agent")
        .text("desktop-tab-config", "配置")
        .build()?;

      let help_menu = SubmenuBuilder::new(app, "帮助")
        .text("desktop-open-github", "打开 GitHub 仓库")
        .build()?;

      let menu = MenuBuilder::new(app)
        .item(&file_menu)
        .item(&view_menu)
        .item(&help_menu)
        .build()?;
      app.set_menu(menu)?;

      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .on_menu_event(|app, event| match event.id().as_ref() {
      "desktop-tab-game" => {
        let _ = app.emit("desktop-menu://tab", json!({ "tab": "game" }));
      }
      "desktop-tab-ops" => {
        let _ = app.emit("desktop-menu://tab", json!({ "tab": "ops" }));
      }
      "desktop-tab-agent" => {
        let _ = app.emit("desktop-menu://tab", json!({ "tab": "agent" }));
      }
      "desktop-tab-config" => {
        let _ = app.emit("desktop-menu://tab", json!({ "tab": "config" }));
      }
      "desktop-export-snapshot" => {
        let _ = app.emit("desktop-menu://action", json!({ "action": "exportSnapshot" }));
      }
      "desktop-reset-demo" => {
        let _ = app.emit("desktop-menu://action", json!({ "action": "resetDemo" }));
      }
      "desktop-refresh" => {
        let _ = app.emit("desktop-menu://action", json!({ "action": "refresh" }));
      }
      "desktop-open-github" => {
        let _ = app.emit("desktop-menu://action", json!({ "action": "openGithub" }));
      }
      "desktop-quit" => app.exit(0),
      _ => {}
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
