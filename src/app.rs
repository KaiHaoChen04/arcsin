use std::path::{Path, PathBuf};
use std::{fs};
use crate::audio::AudioPlayer;
use std::io::Error as IoError;

pub struct App {
    pub current_playlist: Vec<PathBuf>,
    pub selected_index: usize,
    pub is_playing: bool,
    pub volume: f32,
    pub should_quit: bool,
    pub audio_player: AudioPlayer,
}

impl App {
    pub fn new() -> App {
        App {
            current_playlist: vec![],
            selected_index: 0,
            is_playing: false,
            volume: 1.0,
            should_quit: false,
            audio_player: AudioPlayer::new(),
        }
    }

    pub fn on_tick(&mut self) {
        // Update progress, etc.
    }

    pub fn scan_directory(&mut self, path: &Path) ->std::io::Result<()> {
        self.current_playlist.clear();
        let entries = fs::read_dir(path)?;
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Some(extension) = path.extension() {
                    let ext = extension.to_string_lossy().to_lowercase();
                    if ext == "mp3" || ext == "wav" || ext == "ogg" || ext == "flac" {
                        self.current_playlist.push(path);
                    }
                }
            }
        }
        self.current_playlist.sort();
        Ok(())
    }
}
