import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Player from './components/Player';
import TrackList from './components/TrackList';
import Header from './components/Header';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';

function MainPlayer() {
    const [tracks, setTracks] = useState([]);
    const [currentTrack, setCurrentTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        fetch('http://localhost:3000/api/tracks')
            .then(res => res.json())
            .then(data => setTracks(data))
            .catch(err => console.error("Failed to fetch tracks:", err));
    }, []);

    const handleSelectTrack = (track) => {
        setCurrentTrack(track);
        setIsPlaying(true);
    };

    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const handleNext = () => {
        if (!currentTrack || tracks.length <= 1) 
            toast.error("No tracks available");
        else{
            const index = tracks.findIndex(t => t.id === currentTrack.id);
            const nextIndex = (index + 1) % tracks.length;
            setCurrentTrack(tracks[nextIndex]);
            setIsPlaying(true);
        }
    };

    const handlePrev = () => {
        if (!currentTrack || tracks.length <= 1) 
            toast.error("No tracks available");
        else{
            const index = tracks.findIndex(t => t.id === currentTrack.id);
            const prevIndex = (index - 1 + tracks.length) % tracks.length;
            setCurrentTrack(tracks[prevIndex]);
            setIsPlaying(true);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans relative">
            <Header />
            <TrackList 
                tracks={tracks} 
                onSelect={handleSelectTrack} 
                currentTrackId={currentTrack?.id} 
            />
            <Player 
                currentTrack={currentTrack} 
                isPlaying={isPlaying} 
                onPlayPause={handlePlayPause}
                onNext={handleNext}
                onPrev={handlePrev}
            />
        </div>
    );
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <div className="App">
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route 
                            path="/" 
                            element={
                                <ProtectedRoute>
                                    <MainPlayer />
                                </ProtectedRoute>
                            } 
                        />
                    </Routes>
                    <ToastContainer position="top-right" theme="dark" />
                </div>
            </AuthProvider>
        </Router>
    );
}

export default App;
