use crate::tracklist::{Track, TrackList};
use std::fs;
use std::path::Path;

pub struct App {
    pub track_list: TrackList,
}

impl App {
    pub fn new() -> Self {
        Self {
            track_list: TrackList::new(),
        }
    }

    pub fn scan_directory(&mut self, path: &Path) -> std::io::Result<()> {
        let entries = fs::read_dir(path)?;
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Some(extension) = path.extension() {
                    let ext = extension.to_string_lossy().to_lowercase();
                    if ext == "mp3" || ext == "wav" || ext == "ogg" || ext == "flac" {
                        let id = path.file_name().unwrap().to_string_lossy().to_string();
                        let track = Track {
                            id,
                            file_path: path.canonicalize()?, // Use absolute path
                        };
                        self.track_list.add_track(track);
                    }
                }
            }
        }
        Ok(())
    }
}
