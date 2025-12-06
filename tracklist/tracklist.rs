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
    pub fn get_currently_playing(&self) -> Option<&Track> {
        self.currently_playing.as_ref();
    }
    pub fn set_currently_playing(&mut self track: Track) {
        self.currently_playing = Some(track);
    }
    pub fn get_played(&self) -> &Vec<Track> {
        &self.played;
    }
    pub fn get_liked(&self) -> &Vec<Track> {
        &self.liked;
    }
}