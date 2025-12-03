use ratatui::{
    backend::Backend,
    layout::{Constraint, Direction, Layout},
    style::{Color, Modifier, Style},
    widgets::{Block, Borders, List, ListItem, Paragraph},
    Frame,
};

use crate::app::App;

pub fn ui(f: &mut Frame, app: &App) {
    let chunks = Layout::default()
        .direction(Direction::Horizontal)
        .constraints([Constraint::Percentage(30), Constraint::Percentage(70)].as_ref())
        .split(f.size());

    let left_chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([Constraint::Percentage(100)].as_ref())
        .split(chunks[0]);

    let right_chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([Constraint::Min(0), Constraint::Length(3)].as_ref())
        .split(chunks[1]);

    // Sidebar (Library/Playlist)
    let items: Vec<ListItem> = app
        .current_playlist
        .iter()
        .map(|path| {
            let name = path.file_name().unwrap().to_string_lossy();
            ListItem::new(name)
        })
        .collect();

    let list = List::new(items)
        .block(Block::default().borders(Borders::ALL).title("Library"))
        .highlight_style(Style::default().add_modifier(Modifier::BOLD).fg(Color::Green))
        .highlight_symbol("> ");
    
    let mut state = ratatui::widgets::ListState::default();
    state.select(Some(app.selected_index));
    
    f.render_stateful_widget(list, left_chunks[0], &mut state);

    // Main Content (Placeholder for now)
    let main_block = Block::default().borders(Borders::ALL).title("Main");
    f.render_widget(main_block, right_chunks[0]);

    // Player Bar
    let status = if app.is_playing { "Playing" } else { "Paused" };
    let player_text = format!("Status: {} | Volume: {:.0}%", status, app.volume * 100.0);
    let player_bar = Paragraph::new(player_text)
        .block(Block::default().borders(Borders::ALL).title("Now Playing"));
    f.render_widget(player_bar, right_chunks[1]);
}
