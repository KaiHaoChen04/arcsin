use crate::models::TrackRecord;
use sqlx::PgPool;

pub struct App {
    pub db: PgPool,
}

impl App {
    pub fn new(db: PgPool) -> Self {
        Self { db }
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
    pub async fn search_tracks(&self, track_name: &str) -> anyhow::Result<Vec<TrackRecord>> {
        let tracks = sqlx::query_as::<_, TrackRecord>(
            "SELECT id, title, artist, filename, mime_type, created_at, ''::bytea as \"data!\" FROM tracks WHERE title ILIKE $1",
        )
        .bind(format!("%{}%", track_name))
        .fetch_all(&self.db)
        .await?;
        Ok(tracks)
    }

    pub async fn upload_track(
        &self,
        filename: String,
        data: Vec<u8>,
        mime_type: String,
    ) -> anyhow::Result<TrackRecord> {
        // Check if exists by filename (simple deduplication)
        let exists = sqlx::query!("SELECT id FROM tracks WHERE filename = $1", filename)
            .fetch_optional(&self.db)
            .await?;

        if exists.is_some() {
            anyhow::bail!("Track with filename '{}' already exists", filename);
        }

        println!("Uploading track: {}", filename);

        let record = sqlx::query_as!(
            TrackRecord,
            r#"INSERT INTO tracks (title, filename, data, mime_type) 
               VALUES ($1, $2, $3, $4) 
               RETURNING id, title, artist, filename, mime_type, created_at, ''::bytea as "data!""#,
            filename, // Use filename as title for now
            filename,
            data,
            mime_type
        )
        .fetch_one(&self.db)
        .await?;

        Ok(record)
    }
}
