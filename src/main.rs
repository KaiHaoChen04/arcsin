use axum::{
    body::Body,
    extract::{Path, State},
    http::{Method, StatusCode},
    response::{IntoResponse, Response},
    routing::{delete, get, post},
    Json, Router,
};
use std::{net::SocketAddr, sync::Arc};
use tower_http::cors::{Any, CorsLayer};

mod app;
mod auth;
mod db;
mod models;
mod playlist;
mod friends;

use crate::app::App;
use crate::models::TrackRecord;

struct AppState {
    app: App, // access db directly via app.db or just keep app
}

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();

    let pool = db::init_db_pool().await.unwrap();

    // Initialize App with DB
    let app = App::new(pool.clone());

    // Scan and import tracks
    let current_dir = std::env::current_dir().unwrap();
    let assets_dir = current_dir.join("assets");
    println!("Scanning directory: {:?}", assets_dir);
    if let Err(e) = app.import_tracks_from_dir(&assets_dir).await {
        eprintln!("Failed to import tracks: {}", e);
    }

    let state = Arc::new(AppState { app });

    // CORS
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Router
    let app = Router::new()
        .route("/api/tracks", get(list_tracks))
        .route("/api/stream/:id", get(stream_track))
        .route("/auth/register", post(auth::register))
        .route("/auth/login", post(auth::login))
        .route(
            "/api/protected",
            get(protected).layer(axum::middleware::from_fn_with_state(
                state.clone(),
                auth::auth_middleware,
            )),
        )
        .route(
            "/api/playlists",
            get(playlist::list_playlists).post(playlist::create_playlist),
        )
        .route(
            "/api/friends",
            get(friends::list_friends)
                .post(friends::add_friends)
                .layer(axum::middleware::from_fn_with_state(
                    state.clone(),
                    auth::auth_middleware,
                )),
        )
        .route(
            "/api/friends/:friend_id",
            delete(friends::remove_friends).layer(axum::middleware::from_fn_with_state(
                state.clone(),
                auth::auth_middleware,
            )),
        )
        .route(
            "/api/playlists/:id", get(playlist::get_playlist).delete(playlist::delete_playlist))
        .route(
            "/api/playlists/:id/tracks",
            post(playlist::add_track_to_playlist),
        )
        .route(
            "/api/playlists/:id/tracks/:track_id",
            delete(playlist::remove_track_from_playlist),
        )
        .layer(cors)
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    println!("Listening on http://{}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn protected() -> impl IntoResponse {
    "This is a protected route"
}

async fn list_tracks(State(state): State<Arc<AppState>>) -> Json<Vec<TrackRecord>> {
    match state.app.get_tracks().await {
        Ok(tracks) => Json(tracks),
        Err(e) => {
            eprintln!("Error fetching tracks: {}", e);
            Json(vec![])
        }
    }
}

async fn stream_track(
    Path(id): Path<uuid::Uuid>,
    State(state): State<Arc<AppState>>,
    headers: axum::http::HeaderMap,
) -> Result<impl IntoResponse, StatusCode> {
    // Fetch track data from DB
    let record = sqlx::query!("SELECT data, mime_type FROM tracks WHERE id = $1", id)
        .fetch_optional(&state.app.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if let Some(record) = record {
        let file_size = record.data.len();
        println!("Stream request for ID: {}, Size: {}", id, file_size);

        let range_header = headers
            .get(axum::http::header::RANGE)
            .and_then(|h| h.to_str().ok());

        if let Some(range_value) = range_header {
            println!("Received Range header: {}", range_value);
            // Expected format: "bytes=start-end" or "bytes=start-"
            if let Some(ranges) = range_value.strip_prefix("bytes=") {
                let parts: Vec<&str> = ranges.split('-').collect();
                println!("Parts: {:?}", parts);
                if !parts.is_empty() {
                    let start_str = parts[0];
                    let end_str = if parts.len() > 1 { parts[1] } else { "" };

                    let start = start_str.parse::<usize>().unwrap_or(0);
                    let end = if !end_str.is_empty() {
                        end_str.parse::<usize>().unwrap_or(file_size - 1)
                    } else {
                        file_size - 1
                    };

                    println!("Parsed Range: start={}, end={}", start, end);

                    // Clamp end to file_size - 1
                    let end = std::cmp::min(end, file_size - 1);

                    if start > end || start >= file_size {
                        println!("Range not satisfiable");
                        return Err(StatusCode::RANGE_NOT_SATISFIABLE);
                    }

                    let chunk_size = end - start + 1;
                    let data_slice = &record.data[start..=end];
                    let body = Body::from(data_slice.to_vec());

                    println!("Returning 206 Partial Content. Chunk size: {}", chunk_size);
                    return Ok(Response::builder()
                        .status(StatusCode::PARTIAL_CONTENT)
                        .header(axum::http::header::CONTENT_TYPE, record.mime_type)
                        .header(axum::http::header::ACCEPT_RANGES, "bytes")
                        .header(
                            axum::http::header::CONTENT_RANGE,
                            format!("bytes {}-{}/{}", start, end, file_size),
                        )
                        .header(axum::http::header::CONTENT_LENGTH, chunk_size.to_string())
                        .body(body)
                        .unwrap());
                }
            } else {
                println!("Range header did not start with bytes=");
            }
        } else {
            println!("No Range header received. Returning full content.");
        }

        // Full content
        let body = Body::from(record.data);
        Ok(Response::builder()
            .header(axum::http::header::CONTENT_TYPE, record.mime_type)
            .header(axum::http::header::ACCEPT_RANGES, "bytes")
            .header(axum::http::header::CONTENT_LENGTH, file_size.to_string())
            .body(body)
            .unwrap())
    } else {
        Err(StatusCode::NOT_FOUND)
    }
}
