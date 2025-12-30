use axum::{
    body::Body,
    extract::{Path, State},
    http::{Method, StatusCode},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use std::{net::SocketAddr, sync::Arc};
use tower_http::cors::{Any, CorsLayer};

mod app;
mod auth;
mod db;
mod models;
mod tracklist;

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
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
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
) -> Result<Response, StatusCode> {
    // Fetch track data from DB
    let record = sqlx::query!("SELECT data, mime_type FROM tracks WHERE id = $1", id)
        .fetch_optional(&state.app.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if let Some(record) = record {
        // Stream the data
        // For larger files, we should use a Cursor but data is already in memory here as Vec<u8>
        // Ideally we would stream from DB using `copy_out` or chunks, but for now this works.
        let body = Body::from(record.data);

        Ok(Response::builder()
            .header("Content-Type", record.mime_type)
            .body(body)
            .unwrap())
    } else {
        Err(StatusCode::NOT_FOUND)
    }
}
