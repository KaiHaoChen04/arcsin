use serde::{Deserialize, Serialize};
use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json
};

use crate::models::User;
use crate::auth::AuthError;
use crate::AppState;
use std::sync::Arc;

pub async fn list_friends() -> Result<Json<Vec<User>>, AuthError> {
    Ok(Json(vec![]))
}

pub async fn add_friends(State(state): State<Arc<AppState>>) -> Result<StatusCode, StatusCode> {
    Ok(StatusCode::OK)
}

pub async fn remove_friends(State(state): State<Arc<AppState>>) -> Result<StatusCode, StatusCode> {
    Ok(StatusCode::OK)
}