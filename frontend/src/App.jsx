import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useOutletContext } from 'react-router-dom';
import Player from './components/Player';
import TrackList from './components/TrackList';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { PlaylistProvider } from './context/PlaylistContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Playlist from './pages/Playlist';

// Home Page Component
const Home = () => {
    const [tracks, setTracks] = useState([]);
    const { handleSelectTrack, currentTrackId } = useOutletContext();

    useEffect(() => {
        fetch('http://localhost:3000/api/tracks')
            .then(res => res.json())
            .then(data => setTracks(data))
            .catch(err => console.error("Failed to fetch tracks:", err));
    }, []);

    const onSelect = (track) => {
        handleSelectTrack(track, tracks); // Pass all tracks as queue
    };

    return (
        <div className="pb-24 pt-8 px-4 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-white">All Tracks</h1>
            <TrackList 
                tracks={tracks} 
                onSelect={onSelect} 
                currentTrackId={currentTrackId} 
            />
        </div>
    );
};

// Layout Component handling Player State
const Layout = () => {
    const [currentTrack, setCurrentTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [queue, setQueue] = useState([]);

    const handleSelectTrack = (track, newQueue = []) => {
        setCurrentTrack(track);
        // Only update queue if a new queue is provided
        if (newQueue.length > 0) {
            setQueue(newQueue);
        }
        setIsPlaying(true);
    };

    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const handleNext = () => {
        if (!currentTrack || queue.length === 0) {
            toast.error("No tracks in queue");
            return;
        }
        const index = queue.findIndex(t => t.id === currentTrack.id);
        const nextIndex = (index + 1) % queue.length;
        setCurrentTrack(queue[nextIndex]);
        setIsPlaying(true);
    };

    const handlePrev = () => {
        if (!currentTrack || queue.length === 0) {
            toast.error("No tracks in queue");
            return;
        }
        const index = queue.findIndex(t => t.id === currentTrack.id);
        const prevIndex = (index - 1 + queue.length) % queue.length;
        setCurrentTrack(queue[prevIndex]);
        setIsPlaying(true);
    };

    return (
        <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
            <Sidebar />
            
            <div className="flex-1 flex flex-col min-w-0">
                <Header />
                
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                    {/* Pass context to children (Home, Playlist) */}
                    <Routes>
                         <Route path="/" element={<Home />} />
                         <Route path="/playlist/:id" element={<Playlist />} />
                    </Routes>
                </div>
                
                <Player 
                    currentTrack={currentTrack} 
                    isPlaying={isPlaying} 
                    onPlayPause={handlePlayPause}
                    onNext={handleNext}
                    onPrev={handlePrev}
                />
            </div>
            
            <ToastContainer position="top-right" theme="dark" />
        </div>
    );
};

// Wrapper ensuring Context is available
const ProtectedLayout = () => {
    // Need to bridge Outlet context from Layout to Routes? 
    // Actually, Layout *contains* the Routes in my design above.
    // But `Home` calls `useOutletContext`. `Home` is child of `Layout` -> `Routes` -> `Route`?
    // No, `Routes` in `Layout` renders `Home`. `Home` is not an Outlet of Layout. 
    // `Home` is a direct child rendered by Routes. 
    // `useOutletContext` only works if rendered via <Outlet />.
    
    // Correction:
    // To use useOutletContext, I should use a Layout Route.
    // <Route element={<MainLayout />}> ... </Route>
    return (
        <ProtectedRoute>
           <MainLayout /> 
        </ProtectedRoute>
    )
}

const MainLayout = () => {
    const [currentTrack, setCurrentTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [queue, setQueue] = useState([]);

    const handleSelectTrack = (track, newQueue = []) => {
        setCurrentTrack(track);
        if (newQueue.length > 0) setQueue(newQueue);
        setIsPlaying(true);
    };

    const handlePlayPause = () => setIsPlaying(!isPlaying);
    const handleNext = () => {
        if (!currentTrack || queue.length === 0) return;
        const index = queue.findIndex(t => t.id === currentTrack.id);
        const nextIndex = (index + 1) % queue.length;
        setCurrentTrack(queue[nextIndex]);
        setIsPlaying(true);
    };
    const handlePrev = () => {
        if (!currentTrack || queue.length === 0) return;
        const index = queue.findIndex(t => t.id === currentTrack.id);
        const prevIndex = (index - 1 + queue.length) % queue.length;
        setCurrentTrack(queue[prevIndex]);
        setIsPlaying(true);
    };

    return (
        <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Header />
                <div className="flex-1 overflow-y-auto">
                     {/* The Outlet renders the child route (Home or Playlist) */}
                     {/* We pass the player controls via context */}
                     <div className="h-full">
                        <RouterOutlet context={{ handleSelectTrack, currentTrackId: currentTrack?.id }} />
                     </div>
                </div>
                <Player 
                    currentTrack={currentTrack} 
                    isPlaying={isPlaying} 
                    onPlayPause={handlePlayPause}
                    onNext={handleNext}
                    onPrev={handlePrev}
                />
            </div>
        </div>
    );
}

// React Router 6 Outlet component
import { Outlet as RouterOutlet } from 'react-router-dom';

function App() {
    return (
        <Router>
            <AuthProvider>
                <PlaylistProvider>
                    <div className="App">
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            
                            {/* Protected Routes wrapped in MainLayout */}
                            <Route element={
                                <ProtectedRoute>
                                    <MainLayout />
                                </ProtectedRoute>
                            }>
                                <Route path="/" element={<Home />} />
                                <Route path="/playlist/:id" element={<Playlist />} />
                            </Route>
                        </Routes>
                        <ToastContainer position="top-right" theme="dark" />
                    </div>
                </PlaylistProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
