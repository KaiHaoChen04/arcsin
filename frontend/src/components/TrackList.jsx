import React, { useState } from 'react';
import { usePlaylist } from '../context/PlaylistContext';

const TrackList = ({ tracks, onSelect, currentTrackId, playlistId, onRemove }) => {
    const { playlists, addTrackToPlaylist, removeTrackFromPlaylist } = usePlaylist();
    const [openMenuTrackId, setOpenMenuTrackId] = useState(null);

    const handleAdd = async (playlistId, trackId) => {
        await addTrackToPlaylist(playlistId, trackId);
        setOpenMenuTrackId(null);
    };

    const handleRemove = async (e, trackId) => {
        e.stopPropagation();
        if (window.confirm("Remove this track from playlist?")) {
            await removeTrackFromPlaylist(playlistId, trackId);
            if (onRemove) onRemove();
        }
    };

    const toggleMenu = (e, trackId) => {
        e.stopPropagation();
        setOpenMenuTrackId(openMenuTrackId === trackId ? null : trackId);
    };

    return (
        <div className="pb-24 pt-8 px-4 max-w-4xl mx-auto min-h-screen">
            <div className="space-y-2">
                {tracks.map((track) => (
                    <div 
                        key={track.id}
                        onClick={() => onSelect(track)}
                        className={`group relative p-3 rounded-lg cursor-pointer flex items-center justify-between transition-colors ${
                            currentTrackId === track.id 
                                ? "bg-purple-900/50 text-purple-200" 
                                : "hover:bg-gray-800 text-gray-300"
                        }`}
                    >
                        <div className="flex-1 flex flex-col">
                            <span className="font-medium">{track.title || track.filename}</span>
                            <span className="text-xs text-gray-500">{track.artist || "Unknown Artist"}</span>
                        </div>

                        <div className="relative">
                            {playlistId ? (
                                <button 
                                    onClick={(e) => handleRemove(e, track.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Remove from Playlist"
                                >
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            ) : (
                                <>
                                    <button 
                                        onClick={(e) => toggleMenu(e, track.id)}
                                        className="p-2 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Add to Playlist"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                        </svg>
                                    </button>

                                    {openMenuTrackId === track.id && (
                                        <div className="absolute right-0 top-full mt-2 w-48 bg-gray-900 rounded-md shadow-lg z-50 border border-gray-700">
                                            <div className="py-1">
                                                <div className="px-4 py-2 text-xs text-gray-500 uppercase font-semibold border-b border-gray-800">
                                                    Add to Playlist
                                                </div>
                                                {playlists.length === 0 ? (
                                                    <div className="px-4 py-2 text-sm text-gray-500">No playlists</div>
                                                ) : (
                                                    playlists.map(playlist => (
                                                        <button
                                                            key={playlist.id}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleAdd(playlist.id, track.id);
                                                            }}
                                                            className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
                                                        >
                                                            {playlist.name}
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TrackList;
