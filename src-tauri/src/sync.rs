use serde::Serialize;
use std::io::Read;
use std::path::Path;
use tauri::Emitter;

#[derive(Debug, Serialize, Clone)]
pub struct RawEntity {
    pub id: String,
    pub name: String,
    pub entity_type: String,
    pub level: Option<i64>,
    pub hp: Option<i64>,
    pub ac: Option<i64>,
    pub fort: Option<i64>,
    pub ref_save: Option<i64>,
    pub will: Option<i64>,
    pub perception: Option<i64>,
    pub traits: Option<String>,
    pub rarity: Option<String>,
    pub size: Option<String>,
    pub source_pack: Option<String>,
    pub raw_json: String,
    pub source_name: Option<String>,
    // 70-02: adventure segment from paizo-pregens/<adventure>/... path.
    // NULL for iconics (character-level) and every non-paizo-pregens pack.
    pub source_adventure: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct SyncProgress {
    pub stage: String,
    pub current: u64,
    pub total: u64,
}

// 61-fix: allowlist for effect-type entities. The PF2e system ships effects
// across many packs but most of them (bestiary-effects, campaign-effects,
// feat-effects, other-effects, criticaldeck) are noise for the GM's effect
// picker. Keep only the three that the picker actually surfaces usefully.
const ALLOWED_EFFECT_PACKS: &[&str] = &[
    "spell-effects",
    "equipment-effects",
    "boons-and-curses",
];

// 70-01: Paizo-shipped library packs that carry PC/NPC actors. Iconics are
// classic character-level packs (one Amiri file per level); paizo-pregens is
// nested per-adventure (paizo-pregens/<adventure>/<iconic>.json) and stores
// pregen actors bundled with specific adventures.
const PAIZO_LIBRARY_PACKS: &[&str] = &["iconics", "paizo-pregens"];

fn extract_entity(
    value: &serde_json::Value,
    source_pack: &str,
    source_adventure: Option<&str>,
) -> Option<RawEntity> {
    let id = value.get("_id")?.as_str()?.to_string();
    let name = value.get("name")?.as_str()?.to_string();
    let entity_type = value.get("type")?.as_str()?.to_string();

    // 61-fix: drop effects from non-allowlisted packs at sync time so they
    // never make it into the entities table (or the downstream spell_effects
    // table derived from entities).
    if entity_type == "effect" && !ALLOWED_EFFECT_PACKS.contains(&source_pack) {
        return None;
    }

    // 70-02: for Paizo library packs only the actor-shaped records ("character"
    // and "npc") make sense — vehicles/loot ship in the same folders but would
    // pollute the bestiary. Characters stay routed to entities as type='npc'
    // (TS side re-classifies on the `character` marker to also insert into
    // `characters`); NPCs pass through unchanged.
    if PAIZO_LIBRARY_PACKS.contains(&source_pack)
        && entity_type != "character"
        && entity_type != "npc"
    {
        return None;
    }

    let system = value.get("system")?;

    let level = system
        .pointer("/details/level/value")
        .or_else(|| system.pointer("/level/value"))
        .and_then(|v| v.as_i64());

    let hp = system
        .pointer("/attributes/hp/max")
        .and_then(|v| v.as_i64());
    let ac = system
        .pointer("/attributes/ac/value")
        .and_then(|v| v.as_i64());
    let fort = system
        .pointer("/saves/fortitude/value")
        .and_then(|v| v.as_i64());
    let ref_save = system
        .pointer("/saves/reflex/value")
        .and_then(|v| v.as_i64());
    let will = system
        .pointer("/saves/will/value")
        .and_then(|v| v.as_i64());
    let perception = system
        .pointer("/perception/mod")
        .and_then(|v| v.as_i64());

    let traits = system
        .pointer("/traits/value")
        .and_then(|v| v.as_array())
        .map(|arr| {
            serde_json::to_string(
                &arr.iter()
                    .filter_map(|v| v.as_str())
                    .collect::<Vec<_>>(),
            )
            .unwrap_or_default()
        });

    let rarity = system
        .pointer("/traits/rarity")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let size = system
        .pointer("/traits/size/value")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let raw_json = serde_json::to_string(value).ok()?;

    let source_name = value
        .pointer("/system/details/publication/title")
        .and_then(|v| v.as_str())
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string());

    Some(RawEntity {
        id,
        name,
        entity_type,
        level,
        hp,
        ac,
        fort,
        ref_save,
        will,
        perception,
        traits,
        rarity,
        size,
        source_pack: Some(source_pack.to_string()),
        raw_json,
        source_name,
        source_adventure: source_adventure.map(|s| s.to_string()),
    })
}

#[tauri::command]
pub async fn import_local_packs(
    app: tauri::AppHandle,
    pack_dir: String,
) -> Result<Vec<RawEntity>, String> {
    let base = Path::new(&pack_dir);
    if !base.exists() {
        return Err(format!("Directory not found: {}", pack_dir));
    }

    let mut entities = Vec::new();
    let mut packs: Vec<_> = std::fs::read_dir(base)
        .map_err(|e| e.to_string())?
        .filter_map(|e| e.ok())
        .filter(|e| e.path().is_dir())
        .collect();
    packs.sort_by_key(|e| e.file_name());

    let total_packs = packs.len() as u64;

    for (i, pack_entry) in packs.iter().enumerate() {
        let pack_name = pack_entry.file_name().to_string_lossy().to_string();
        // Skip non-PF2e pack directories
        if pack_name != "pf2e" {
            continue;
        }
        let _ = app.emit(
            "sync-progress",
            SyncProgress {
                stage: format!("Reading pack: {}", pack_name),
                current: i as u64 + 1,
                total: total_packs,
            },
        );

        let json_files = find_json_files(&pack_entry.path());
        for json_path in json_files {
            if let Ok(contents) = std::fs::read_to_string(&json_path) {
                if let Ok(value) = serde_json::from_str::<serde_json::Value>(&contents) {
                    // 70-02: local-pack layout — <pack_dir>/pf2e/<pack>/[<adventure>]/...
                    // extract_pack_name expects the ZIP-style path, so reconstruct it
                    // relative to pack_entry so the pregen-adventure parser is reused.
                    let rel_display = json_path
                        .strip_prefix(&pack_entry.path())
                        .ok()
                        .map(|p| p.to_string_lossy().replace('\\', "/"))
                        .unwrap_or_default();
                    let synth_zip_path = format!("packs/pf2e/{}", rel_display);
                    let pack_for_entry = extract_pack_name(&synth_zip_path);
                    let adventure = extract_source_adventure(&synth_zip_path, &pack_for_entry);
                    if let Some(entity) = extract_entity(&value, &pack_for_entry, adventure.as_deref()) {
                        entities.push(entity);
                    }
                }
            }
        }
    }

    let _ = app.emit(
        "sync-progress",
        SyncProgress {
            stage: "Import complete".to_string(),
            current: entities.len() as u64,
            total: entities.len() as u64,
        },
    );

    Ok(entities)
}

fn find_json_files(dir: &Path) -> Vec<std::path::PathBuf> {
    let mut files = Vec::new();
    if let Ok(entries) = std::fs::read_dir(dir) {
        for entry in entries.filter_map(|e| e.ok()) {
            let path = entry.path();
            if path.is_dir() {
                files.extend(find_json_files(&path));
            } else if path.extension().and_then(|e| e.to_str()) == Some("json") {
                files.push(path);
            }
        }
    }
    files
}

#[tauri::command]
pub async fn sync_foundry_data(
    app: tauri::AppHandle,
    url: Option<String>,
) -> Result<Vec<RawEntity>, String> {
    let _ = app.emit(
        "sync-progress",
        SyncProgress {
            stage: "Fetching release info...".to_string(),
            current: 0,
            total: 0,
        },
    );

    let client = reqwest::Client::builder()
        .user_agent("pathmaid/0.3.0")
        .build()
        .map_err(|e| e.to_string())?;

    let download_url = match url {
        Some(u) => u,
        None => {
            let release: serde_json::Value = client
                .get("https://api.github.com/repos/foundryvtt/pf2e/releases/latest")
                .send()
                .await
                .map_err(|e| format!("Failed to fetch release info: {}", e))?
                .json()
                .await
                .map_err(|e| format!("Failed to parse release JSON: {}", e))?;

            release
                .get("zipball_url")
                .and_then(|v| v.as_str())
                .ok_or("No zipball_url in release response")?
                .to_string()
        }
    };

    let _ = app.emit(
        "sync-progress",
        SyncProgress {
            stage: "Downloading ZIP...".to_string(),
            current: 0,
            total: 0,
        },
    );

    let bytes = client
        .get(&download_url)
        .send()
        .await
        .map_err(|e| format!("Download failed: {}", e))?
        .bytes()
        .await
        .map_err(|e| format!("Failed to read response: {}", e))?;

    let _ = app.emit(
        "sync-progress",
        SyncProgress {
            stage: "Extracting packs...".to_string(),
            current: 0,
            total: 0,
        },
    );

    let cursor = std::io::Cursor::new(bytes);
    let mut archive =
        zip::ZipArchive::new(cursor).map_err(|e| format!("Failed to open ZIP: {}", e))?;

    let mut entities = Vec::new();
    let total_files = archive.len() as u64;

    for i in 0..archive.len() {
        let mut file = archive
            .by_index(i)
            .map_err(|e| format!("Failed to read ZIP entry: {}", e))?;

        if file.is_dir() {
            continue;
        }

        let file_name = file.name().to_string();
        if !file_name.ends_with(".json") {
            continue;
        }

        // Skip non-PF2e packs (e.g. Starfinder sf2e content)
        if !file_name.contains("/packs/pf2e/") {
            continue;
        }

        let source_pack = extract_pack_name(&file_name);
        let source_adventure = extract_source_adventure(&file_name, &source_pack);

        if i % 500 == 0 {
            let _ = app.emit(
                "sync-progress",
                SyncProgress {
                    stage: format!("Extracting entities ({}/{})", i, total_files),
                    current: i as u64,
                    total: total_files,
                },
            );
        }

        let mut contents = String::new();
        if file.read_to_string(&mut contents).is_ok() {
            if let Ok(value) = serde_json::from_str::<serde_json::Value>(&contents) {
                if let Some(entity) = extract_entity(&value, &source_pack, source_adventure.as_deref()) {
                    entities.push(entity);
                }
            }
        }
    }

    let _ = app.emit(
        "sync-progress",
        SyncProgress {
            stage: "Extraction complete".to_string(),
            current: entities.len() as u64,
            total: entities.len() as u64,
        },
    );

    Ok(entities)
}

fn extract_pack_name(zip_path: &str) -> String {
    // 61-fix: return the pack sub-directory (e.g. "equipment-effects",
    // "spell-effects", "bestiary") not the umbrella "pf2e" segment.
    // Layout: systems/pf2e/packs/pf2e/<pack-id>/<file>.json
    // We skip the "pf2e" umbrella dir and return the real pack id.
    let parts: Vec<&str> = zip_path.split('/').collect();
    for (i, part) in parts.iter().enumerate() {
        if *part == "packs" {
            let mut next_idx = i + 1;
            // Skip the "pf2e" umbrella if present so we land on the real pack id.
            if parts.get(next_idx).copied() == Some("pf2e") {
                next_idx += 1;
            }
            if let Some(pack) = parts.get(next_idx) {
                // Guard against the json file itself being the next segment
                // (pack layout without subfolder) — fall back to the umbrella.
                if pack.ends_with(".json") {
                    return parts.get(i + 1).unwrap_or(&"pf2e").to_string();
                }
                return pack.to_string();
            }
        }
    }
    if parts.len() >= 2 {
        return parts[parts.len() - 2].to_string();
    }
    "unknown".to_string()
}

// 70-02: for `paizo-pregens` the canonical layout is
//   packs/pf2e/paizo-pregens/<adventure>/<iconic>.json
// and we store the `<adventure>` segment (e.g. `beginner-box`, `sundered-waves`)
// on every RawEntity so the UI can offer an adventure-scoped source filter.
// Any non-pregens pack (including `iconics` itself, which is character-level)
// returns None.
fn extract_source_adventure(zip_path: &str, source_pack: &str) -> Option<String> {
    if source_pack != "paizo-pregens" {
        return None;
    }
    let parts: Vec<&str> = zip_path.split('/').collect();
    for (i, part) in parts.iter().enumerate() {
        if *part == "paizo-pregens" {
            let next = parts.get(i + 1)?;
            // Guard against the single-level case (pregens/<file>.json without
            // an adventure folder) — treat as NULL rather than mis-tag.
            if next.ends_with(".json") {
                return None;
            }
            return Some((*next).to_string());
        }
    }
    None
}
