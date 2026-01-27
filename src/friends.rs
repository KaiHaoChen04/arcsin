use crate::auth::{AuthError, Claims};
use crate::models::User;
use crate::AppState;
use axum::{
    extract::{Extension, Path, State},
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use std::sync::Arc;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct AddFriendPayload {
    pub username: String,
}

pub async fn list_friends(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<Vec<User>>, AuthError> {
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE username = $1")
        .bind(&claims.sub)
        .fetch_optional(&state.app.db)
        .await
        .map_err(|_| AuthError::WrongCredentials)?
        .ok_or(AuthError::WrongCredentials)?;

    let friends = sqlx::query_as::<_, User>(
        "SELECT u.* FROM users u
         JOIN friends f ON u.id = f.friend_id
         WHERE f.user_id = $1",
    )
    .bind(user.id)
    .fetch_all(&state.app.db)
    .await
    .map_err(|_| AuthError::TokenCreation)?; // using TokenCreation as generic 500 for now or add DB error

    Ok(Json(friends))
}

pub async fn add_friends(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<AddFriendPayload>,
) -> Result<StatusCode, AuthError> {
    let current_user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE username = $1")
        .bind(&claims.sub) // retrieve user by claims subject
        .fetch_one(&state.app.db)
        .await
        .map_err(|_| AuthError::WrongCredentials)?;

    let friend_user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE username = $1")
        .bind(&payload.username)
        .fetch_one(&state.app.db)
        .await
        .map_err(|_| AuthError::WrongCredentials)?;

    if current_user.id == friend_user.id {
        return Err(AuthError::CannotAddYourself);
    }

    // Insert forward relationship
    sqlx::query("INSERT INTO friends (user_id, friend_id) VALUES ($1, $2) ON CONFLICT DO NOTHING")
        .bind(current_user.id)
        .bind(friend_user.id)
        .execute(&state.app.db)
        .await
        .map_err(|_| AuthError::TokenCreation)?;

    Ok(StatusCode::CREATED)
}

pub async fn remove_friends(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(friend_id): Path<Uuid>,
) -> Result<StatusCode, AuthError> {
    let current_user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE username = $1")
        .bind(&claims.sub)
        .fetch_optional(&state.app.db)
        .await
        .map_err(|_| AuthError::WrongCredentials)?
        .ok_or(AuthError::WrongCredentials)?;

    sqlx::query("DELETE FROM friends WHERE user_id = $1 AND friend_id = $2")
        .bind(current_user.id)
        .bind(friend_id)
        .execute(&state.app.db)
        .await
        .map_err(|_| AuthError::TokenCreation)?;

    Ok(StatusCode::OK)
}
