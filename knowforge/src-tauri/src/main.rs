#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::{Manager, State};
use std::sync::Mutex;
use rusqlite::{Connection, Result};

struct AppState {
    db: Mutex<Connection>,
}

// 初始化数据库
fn init_db() -> Result<Connection> {
    let conn = Connection::open("knowforge.db")?;
    
    conn.execute(
        "CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            tags TEXT,
            source TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;
    
    conn.execute(
        "CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            color TEXT,
            count INTEGER DEFAULT 0
        )",
        [],
    )?;
    
    Ok(conn)
}

// 添加笔记
#[tauri::command]
fn add_note(state: State<AppState>, title: String, content: String, tags: Option<String>) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    db.execute(
        "INSERT INTO notes (title, content, tags) VALUES (?1, ?2, ?3)",
        [&title, &content, &tags.unwrap_or_default()],
    ).map_err(|e| e.to_string())?;
    
    Ok("Note added successfully".to_string())
}

// 搜索笔记
#[tauri::command]
fn search_notes(state: State<AppState>, query: String) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    let mut stmt = db.prepare(
        "SELECT id, title, content, tags, created_at FROM notes 
         WHERE title LIKE ?1 OR content LIKE ?1 OR tags LIKE ?1
         ORDER BY created_at DESC"
    ).map_err(|e| e.to_string())?;
    
    let pattern = format!("%{}%", query);
    let notes: Vec<_> = stmt.query_map([&pattern], |row| {
        Ok({
            let id: i64 = row.get(0)?;
            let title: String = row.get(1)?;
            let content: String = row.get(2)?;
            let tags: String = row.get(3)?;
            let created_at: String = row.get(4)?;
            serde_json::json!({
                "id": id,
                "title": title,
                "content": content,
                "tags": tags,
                "created_at": created_at
            })
        })
    }).map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())?;
    
    serde_json::to_string(&notes).map_err(|e| e.to_string())
}

// 获取所有标签
#[tauri::command]
fn get_tags(state: State<AppState>) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    let mut stmt = db.prepare("SELECT name, color, count FROM tags ORDER BY count DESC")
        .map_err(|e| e.to_string())?;
    
    let tags: Vec<_> = stmt.query_map([], |row| {
        Ok({
            let name: String = row.get(0)?;
            let color: String = row.get(1)?;
            let count: i64 = row.get(2)?;
            serde_json::json!({
                "name": name,
                "color": color,
                "count": count
            })
        })
    }).map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())?;
    
    serde_json::to_string(&tags).map_err(|e| e.to_string())
}

fn main() {
    let db = init_db().expect("Failed to initialize database");
    
    tauri::Builder::default()
        .manage(AppState { db: Mutex::new(db) })
        .invoke_handler(tauri::generate_handler![add_note, search_notes, get_tags])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}