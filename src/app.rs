use crate::models::TrackRecord;
use sqlx::PgPool;
use std::fs;
use std::path::{Path, PathBuf};

pub struct App {
    pub db: PgPool,
}

impl App {
    pub fn new(db: PgPool) -> Self {
        Self { db }
    }

    pub async fn import_tracks_from_dir(&self, path: &Path) -> std::io::Result<()> {
        let entries = fs::read_dir(path)?;
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Some(extension) = path.extension() {
                    let ext = extension.to_string_lossy().to_lowercase();
                    if ["mp3", "wav", "ogg", "flac"].contains(&ext.as_str()) {
                        self.import_track(&path).await.ok();
                    }
                }
            }
        }
        Ok(())
    }

    async fn import_track(&self, path: &PathBuf) -> anyhow::Result<()> {
        let filename = path.file_name().unwrap().to_string_lossy().to_string();

        // Check if exists by filename (simple deduplication)
        let exists = sqlx::query!("SELECT id FROM tracks WHERE filename = $1", filename)
            .fetch_optional(&self.db)
            .await?;

        if exists.is_none() {
            println!("Importing track: {}", filename);
            let data = fs::read(path)?;
            let mime_type = mime_guess::from_path(path)
                .first_or_octet_stream()
                .to_string();

            sqlx::query!(
                "INSERT INTO tracks (title, filename, data, mime_type) VALUES ($1, $2, $3, $4)",
                filename, // Use filename as title for now
                filename,
                data,
                mime_type
            )
            .execute(&self.db)
            .await?;
        }
        Ok(())
    }

    pub async fn get_tracks(&self) -> anyhow::Result<Vec<TrackRecord>> {
        let tracks = sqlx::query_as!(
            TrackRecord,
            "SELECT id, title, artist, filename, mime_type, created_at, ''::bytea as \"data!\" FROM tracks"
        )
        .fetch_all(&self.db)
        .await?;
        Ok(tracks)
    }
}
