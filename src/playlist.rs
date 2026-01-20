use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use time::OffsetDateTime;
use uuid::Uuid;

use crate::models::TrackRecord;
use crate::AppState;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Playlist {
    pub id: Uuid,
    pub user_id: Option<Uuid>,
    pub name: String,
    pub description: Option<String>,
    #[serde(with = "time::serde::iso8601")]
    pub created_at: OffsetDateTime,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PlaylistWithTracks {
    #[serde(flatten)]
    pub playlist: Playlist,
    pub tracks: Vec<TrackRecord>,
}

#[derive(Deserialize)]
pub struct CreatePlaylistPayload {
    pub name: String,
    pub description: Option<String>,
}

#[derive(Deserialize)]
pub struct AddTrackPayload {
    pub track_id: Uuid,
}

pub async fn list_playlists(
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<Playlist>>, StatusCode> {
    // TODO: Filter by user_id from auth token. For now, list all.
    let playlists =
        sqlx::query_as::<_, Playlist>("SELECT * FROM playlists ORDER BY created_at DESC")
            .fetch_all(&state.app.db)
            .await
            .map_err(|e| {
                eprintln!("Error listing playlists: {}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?;

    Ok(Json(playlists))
}

pub async fn create_playlist(
    State(state): State<Arc<AppState>>,
    // TODO: Extract user_id from Claims
    Json(payload): Json<CreatePlaylistPayload>,
) -> Result<Json<Playlist>, StatusCode> {
    let playlist = sqlx::query_as::<_, Playlist>(
        "INSERT INTO playlists (name, description) VALUES ($1, $2) RETURNING *",
    )
    .bind(payload.name)
    .bind(payload.description)
    .fetch_one(&state.app.db)
    .await
    .map_err(|e| {
        eprintln!("Error creating playlist: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(playlist))
}
pub async fn delete_playlist(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, StatusCode> {
    sqlx::query!("DELETE FROM playlists WHERE id = $1", id)
        .execute(&state.app.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(StatusCode::OK)
}

pub async fn get_playlist(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<PlaylistWithTracks>, StatusCode> {
    let playlist = sqlx::query_as::<sqlx::Postgres, Playlist>("SELECT * FROM playlists WHERE id = $1")
        .bind(id)
        .fetch_optional(&state.app.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    // Fetch tracks
    // Join playlist_tracks with tracks
    let tracks = sqlx::query_as::<sqlx::Postgres, TrackRecord>(
        r#"
        SELECT t.* 
        FROM tracks t
        JOIN playlist_tracks pt ON t.id = pt.track_id
        WHERE pt.playlist_id = $1
        ORDER BY pt.order_index ASC, pt.added_at ASC
        "#,
    )
    .bind(id)
    .fetch_all(&state.app.db)
    .await
    .map_err(|e| {
        eprintln!("Error fetching playlist tracks: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(PlaylistWithTracks { playlist, tracks }))
}

pub async fn add_track_to_playlist(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
    Json(payload): Json<AddTrackPayload>,
) -> Result<StatusCode, StatusCode> {
    // Check if exists
    let _exists = sqlx::query!("SELECT id FROM playlists WHERE id = $1", id)
        .fetch_optional(&state.app.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    // Add track
    sqlx::query!(
        "INSERT INTO playlist_tracks (playlist_id, track_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        id,
        payload.track_id
    )
    .execute(&state.app.db)
    .await
    .map_err(|e| {
        eprintln!("Error adding track to playlist: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(StatusCode::OK)
}

pub async fn remove_track_from_playlist(
    State(state): State<Arc<AppState>>,
    Path((playlist_id, track_id)): Path<(Uuid, Uuid)>,
) -> Result<StatusCode, StatusCode> {
    sqlx::query!(
        "DELETE FROM playlist_tracks WHERE playlist_id = $1 AND track_id = $2",
        playlist_id,
        track_id
    )
    .execute(&state.app.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(StatusCode::OK)
}
