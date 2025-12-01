use rodio::{Decoder, OutputStream, OutputStreamHandle, Sink};
use std::fs::File;
use std::io::BufReader;
use std::path::Path;

pub struct AudioPlayer {
    _stream: OutputStream,
    stream_handle: OutputStreamHandle,
    sink: Sink,
}

impl AudioPlayer {
    pub fn new() -> Self {
        // Panic if no audio device is available
        let (_stream, stream_handle) = OutputStream::try_default().unwrap();
        let sink = Sink::try_new(&stream_handle).unwrap();
        
        // Constructor
        AudioPlayer {
            _stream,
            stream_handle,
            sink,
        }
    }

    pub fn play_file(&self, path: &Path) {
        if !self.sink.empty() {
            self.sink.stop();
        }

        let file = File::open(path).unwrap();
        let source = Decoder::new(BufReader::new(file)).unwrap();
        self.sink.append(source);
        self.sink.play();
    }

    pub fn pause(&self) {
        self.sink.pause();
    }

    pub fn resume(&self) {
        self.sink.play();
    }

    pub fn set_volume(&self, volume: f32) {
        let clamped = volume.clamp(0.0, 2.0);
        self.sink.set_volume(clamped);
    }
    
    pub fn is_paused(&self) -> bool {
        self.sink.is_paused()
    }
}
