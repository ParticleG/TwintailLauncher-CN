use tauri::{AppHandle, Runtime, Manager};
use crate::utils::db_manager::{delete_repository_by_id, get_repositories, get_repository_info_by_id};
use crate::utils::models::LauncherRepository;
use crate::utils::repo_manager::{clone_new_repository, load_manifests};

#[tauri::command]
pub fn list_repositories<R: Runtime>(app: AppHandle<R>) -> Option<Vec<LauncherRepository>> {
    get_repositories(&app)
}

#[tauri::command]
pub fn get_repository<R: Runtime>(app: AppHandle<R>, repository_id: String) -> Option<LauncherRepository> {
    get_repository_info_by_id(&app, repository_id)
}

#[tauri::command]
pub fn add_repository<R: Runtime>(app: AppHandle<R>, url: String) -> Option<bool> {
    // clone_new_repository reads the owner and name from https://<host>/<owner>/<name>
    let parts = url.split('/').collect::<Vec<&str>>();
    if !url.starts_with("https://") || parts.len() != 5 || parts[2..].iter().any(|p| p.is_empty()) {
        log::warn!("Rejected repository URL: {}", url);
        None
    } else {
        log::info!("Adding repository: {}", url);
        let data_dir = app.path().app_data_dir().unwrap();
        let rtn = clone_new_repository(&app, &data_dir.join("manifests"), url.clone());

        if rtn.is_ok() {
            let added = rtn.unwrap();
            if added {
                log::info!("Successfully added repository: {}", url);
                // Make the new games available without restarting the launcher
                load_manifests(&app, data_dir);
            } else {
                log::warn!("Repository was not added (invalid or already present): {}", url);
            }
            Some(added)
        } else {
            log::warn!("Failed to add repository: {}", url);
            None
        }
    }
}

#[tauri::command]
pub fn remove_repository<R: Runtime>(app: AppHandle<R>, id: String) -> Option<bool> {
    if id.is_empty() {
        None
    } else {
        log::info!("Removing repository {}", id);
        // TODO: Properly delete repository bullshit and disallow if installation with ANY manifest of a repo exists
        let rtn = delete_repository_by_id(&app, id.clone());
        if rtn.is_ok() {
            log::info!("Successfully removed repository {}", id);
            Some(rtn.unwrap())
        } else {
            log::warn!("Failed to remove repository {}", id);
            None
        }
    }
}