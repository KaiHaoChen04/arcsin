CREATE TABLE IF NOT EXISTS tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255),
    filename VARCHAR(255) NOT NULL,
    data BYTEA NOT NULL,
    mime_type VARCHAR(50) NOT NULL DEFAULT 'audio/mpeg',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
