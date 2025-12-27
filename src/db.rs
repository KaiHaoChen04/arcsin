use anyhow::Result;
use sqlx::postgres::{PgPool, PgPoolOptions};
use std::env;

pub async fn init_db_pool() -> Result<PgPool> {
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    Ok(pool)
}
