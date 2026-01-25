use crate::models::{AuthBody, LoginPayload, RegisterPayload, User};
use crate::AppState;
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use axum::{
    extract::{Request, State},
    http::{header, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
    Json,
};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use time::{Duration, OffsetDateTime};
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    sub: String, // user
    exp: usize,  // expiration
    iat: usize,  // issued at
}

pub enum AuthError {
    WrongCredentials,
    MissingCredentials,
    TokenCreation,
    UserAlreadyExists,
    UserTimeOut,
}

impl IntoResponse for AuthError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            AuthError::WrongCredentials => (StatusCode::UNAUTHORIZED, "Wrong credentials"),
            AuthError::MissingCredentials => (StatusCode::BAD_REQUEST, "Missing credentials"),
            AuthError::TokenCreation => (StatusCode::INTERNAL_SERVER_ERROR, "Token creation error"),
            AuthError::UserAlreadyExists => (StatusCode::BAD_REQUEST, "User already exists"),
            AuthError::UserTimeOut => (StatusCode::GATEWAY_TIMEOUT, "Time out"),
        };
        let body = Json(serde_json::json!({
            "error": error_message,
        }));
        (status, body).into_response()
    }
}

pub async fn register(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<RegisterPayload>,
) -> Result<Json<User>, AuthError> {
    if payload.validate().is_err() {
        return Err(AuthError::MissingCredentials);
    }

    let password = payload.password.as_bytes();
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(password, &salt)
        .map_err(|_| AuthError::TokenCreation)?
        .to_string();

    let user = sqlx::query_as::<_, User>(
        "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING *",
    )
    .bind(payload.username)
    .bind(password_hash)
    .fetch_one(&state.app.db)
    .await
    .map_err(|_| AuthError::UserAlreadyExists)?;

    Ok(Json(user))
}

pub async fn login(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<LoginPayload>,
) -> Result<Json<AuthBody>, AuthError> {
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE username = $1")
        .bind(payload.username)
        .fetch_optional(&state.app.db)
        .await
        .map_err(|_| AuthError::WrongCredentials)?
        .ok_or(AuthError::WrongCredentials)?;

    let parsed_hash =
        PasswordHash::new(&user.password_hash).map_err(|_| AuthError::WrongCredentials)?;
    Argon2::default()
        .verify_password(payload.password.as_bytes(), &parsed_hash)
        .map_err(|_| AuthError::WrongCredentials)?;

    let now = OffsetDateTime::now_utc();
    let iat = now.unix_timestamp() as usize;
    let exp = (now + Duration::hours(2)).unix_timestamp() as usize;
    let claims = Claims {
        sub: user.username,
        exp,
        iat,
    };

    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|_| AuthError::TokenCreation)?;

    Ok(Json(AuthBody::new(token)))
}

pub async fn auth_middleware(
    State(_state): State<Arc<AppState>>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let auth_header = req
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|header| header.to_str().ok())
        .ok_or(StatusCode::UNAUTHORIZED)?;

    if !auth_header.starts_with("Bearer ") {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let token = &auth_header[7..];
    let secret = std::env::var("JWT_SECRET").expect("JWT_SECRET must be set");

    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default(),
    )
    .map_err(|_| StatusCode::UNAUTHORIZED)?;

    req.extensions_mut().insert(token_data.claims);

    Ok(next.run(req).await)
}
