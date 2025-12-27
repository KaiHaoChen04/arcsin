use axum::{
    body::Body,
    extract::{Path, State},
    http::{Method, StatusCode},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use std::{
    net::SocketAddr,
    sync::{Arc, Mutex},
};
use tokio::fs::File;
use tokio_util::io::ReaderStream;
use tower_http::{
    cors::{Any, CorsLayer},
    services::ServeDir,
};

mod app;
mod auth;
mod db;
mod models;
mod tracklist;

use crate::app::App;
use crate::tracklist::Track;
use sqlx::PgPool;

struct AppState {
    app: Mutex<App>,
    db: PgPool,
}

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();

    // Initialize App and scan current directory
    let mut app = App::new();
    let current_dir = std::env::current_dir().unwrap();
    let assets_dir = current_dir.join("assets");
    println!("Scanning directory: {:?}", assets_dir);
    app.scan_directory(&assets_dir).unwrap();

    let pool = db::init_db_pool().await.unwrap();

    let state = Arc::new(AppState {
        app: Mutex::new(app),
        db: pool,
    });

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
        // Serve frontend files (later)
        // .nest_service("/", ServeDir::new("frontend/dist"))
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

async fn list_tracks(State(state): State<Arc<AppState>>) -> Json<Vec<Track>> {
    let app = state.app.lock().unwrap();
    Json(app.track_list.tracks.clone())
}

async fn stream_track(
    Path(id): Path<String>,
    State(state): State<Arc<AppState>>,
) -> Result<Response, StatusCode> {
    let path = {
        let app = state.app.lock().unwrap();
        app.track_list
            .tracks
            .iter()
            .find(|t| t.id == id)
            .map(|t| t.file_path.clone())
    };

    if let Some(path) = path {
        let file = File::open(path).await.map_err(|_| StatusCode::NOT_FOUND)?;
        let stream = ReaderStream::new(file);
        let body = Body::from_stream(stream);

        Ok(Response::builder()
            .header("Content-Type", "audio/mpeg") // Simplified, ideally detect type
            .body(body)
            .unwrap())
    } else {
        Err(StatusCode::NOT_FOUND)
    }
}
