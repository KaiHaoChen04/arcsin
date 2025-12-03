use anyhow::Result;
use crossterm::{
    event::{self, DisableMouseCapture, EnableMouseCapture, Event, KeyCode},
    execute,
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
};
use ratatui::{backend::CrosstermBackend, Terminal};
use std::{io, time::Duration};

mod app;
mod ui;
mod audio;

use crate::app::App;
use crate::ui::ui;

fn main() -> Result<()> {
    // Setup terminal
    enable_raw_mode()?;
    let mut stdout = io::stdout();
    execute!(stdout, EnterAlternateScreen, EnableMouseCapture)?;
    let backend = CrosstermBackend::new(stdout);
    let mut terminal = Terminal::new(backend)?;

    // Create app
    let mut app = App::new();
    app.scan_directory(&std::env::current_dir()?)?;

    // Run app
    let res = run_app(&mut terminal, &mut app);

    // Restore terminal
    disable_raw_mode()?;
    execute!(
        terminal.backend_mut(),
        LeaveAlternateScreen,
        DisableMouseCapture
    )?;
    terminal.show_cursor()?;

    if let Err(err) = res {
        println!("{:?}", err)
    }

    Ok(())
}

fn run_app<B: ratatui::backend::Backend>(
    terminal: &mut Terminal<B>,
    app: &mut App,
) -> io::Result<()> {
    loop {
        terminal.draw(|f| ui(f, app))?;

        if crossterm::event::poll(Duration::from_millis(250))? {
            if let Event::Key(key) = event::read()? {
                match key.code {
                    KeyCode::Char('q') | KeyCode::Esc => {
                        app.should_quit = true;
                    }
                    KeyCode::Down | KeyCode::Char('j') => {
                        if !app.current_playlist.is_empty() {
                            app.selected_index = (app.selected_index + 1) % app.current_playlist.len();
                        }
                    }
                    KeyCode::Up | KeyCode::Char('k') => {
                        if !app.current_playlist.is_empty() {
                            if app.selected_index > 0 {
                                app.selected_index -= 1;
                            } else {
                                app.selected_index = app.current_playlist.len() - 1;
                            }
                        }
                    }
                    KeyCode::Enter => {
                        if let Some(path) = app.current_playlist.get(app.selected_index) {
                            app.audio_player.play_file(path);
                            app.is_playing = true;
                        }
                    }
                    KeyCode::Char(' ') => {
                        if app.is_playing {
                            app.audio_player.pause();
                            app.is_playing = false;
                        } 
                        else {
                            app.audio_player.resume();
                            app.is_playing = true;
                        }
                    }
                    KeyCode::Char('+') | KeyCode::Char('=') => {
                        app.volume = (app.volume + 0.1).clamp(0.0, 2.0);
                        app.audio_player.set_volume(app.volume);
                    }
                    KeyCode::Char('-') | KeyCode::Char('_') => {
                        app.volume = (app.volume - 0.1).clamp(0.0, 2.0);
                        app.audio_player.set_volume(app.volume);
                    }
                    _ => {}
                }
            }
        }

        if app.should_quit {
            return Ok(());
        }
    }
}
