use music_player_entity::track::Model as Track;


pub struct TrackList{
    tracks: Vec<Track>,
    played: Vec<Track>,
    liked: Vec<Track>,
    currently_playing: Option<Track>,
}

impl TrackList{
    pub fn new() -> TrackList{
        TrackList{
            tracks,
            played: Vec::new(),
            liked: Vec::new(),
            currently_playing: None,
        }
    }
    pub fn add_track(&mut self, track:Track) {
        self.tracks.push(track);
    }
    pub fn remove_track(&mut self, track:Track) {
        self.tracks.retain(|t| t.id != track.id);
        self.played.retain(|t| t.id != track.id);
        self.liked.retain(|t| t.id != track.id);
    }
}