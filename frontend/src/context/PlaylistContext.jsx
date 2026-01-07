import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';

const PlaylistContext = createContext(null);

export const PlaylistProvider = ({ children }) => {
    const [playlists, setPlaylists] = useState([]);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            fetchPlaylists();
        } else {
            setPlaylists([]);
        }
    }, [user]);

    const fetchPlaylists = async () => {
        try {
            const res = await axios.get('http://localhost:3000/api/playlists');
            setPlaylists(res.data);
        } catch (error) {
            console.error("Failed to fetch playlists");
        }
    };

    const createPlaylist = async (name, description = "") => {
        try {
            const res = await axios.post('http://localhost:3000/api/playlists', {
                name,
                description
            });
            setPlaylists([res.data, ...playlists]);
            toast.success("Playlist created");
            return res.data;
        } catch (error) {
            toast.error("Failed to create playlist");
            throw error;
        }
    };

    const addTrackToPlaylist = async (playlistId, trackId) => {
        try {
            await axios.post(`http://localhost:3000/api/playlists/${playlistId}/tracks`, {
                track_id: trackId
            });
            toast.success("Track added to playlist");
        } catch (error) {
            console.error(error);
            toast.error("Failed to add track");
        }
    };

    const removeTrackFromPlaylist = async (playlistId, trackId) => {
        try {
            await axios.delete(`http://localhost:3000/api/playlists/${playlistId}/tracks/${trackId}`);
            toast.success("Track removed from playlist");
            // If we are viewing the playlist, we might want to trigger a refresh or update local state.
            // For now, let's just hope the parent component re-fetches or we can add a callback.
        } catch (error) {
            console.error(error);
            toast.error("Failed to remove track");
        }
    };

    return (
        <PlaylistContext.Provider value={{ playlists, createPlaylist, addTrackToPlaylist, removeTrackFromPlaylist, fetchPlaylists }}>
            {children}
        </PlaylistContext.Provider>
    );
};

export const usePlaylist = () => useContext(PlaylistContext);
