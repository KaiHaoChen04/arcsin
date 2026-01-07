-- Create playlists table
CREATE TABLE IF NOT EXISTS playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create junction table for tracks in playlists
CREATE TABLE IF NOT EXISTS playlist_tracks (
    playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
    track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT now(),
    order_index INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (playlist_id, track_id)
);
