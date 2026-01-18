import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePlaylist } from '../context/PlaylistContext';
import { House, Users, Search } from 'lucide-react';

const Sidebar = () => {
    const { playlists, createPlaylist } = usePlaylist();
    const [isCreating, setIsCreating] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleCreatePlaylist = async (e) => {
        e.preventDefault();
        if (!newPlaylistName.trim()) return;

        try {
            const newPlaylist = await createPlaylist(newPlaylistName, "Created via Web");
            setNewPlaylistName('');
            setIsCreating(false);
            navigate(`/playlist/${newPlaylist.id}`);
        } catch (error) {
            // Toast handled in context
        }
    };

    return (
        <div className="w-64 bg-black border-r border-gray-800 flex flex-col h-full bg-opacity-90 backdrop-blur-md">
            <div className="p-6">
                <Link to="/" className="text-2xl font-bold text-white mb-8 block hover:text-purple-400 transition">Arcsin</Link>
                
                <nav className="space-y-4">
                    <Link to="/" className="flex items-center text-gray-300 hover:text-white transition">
                        <House className="mr-3" /> Home
                    </Link>
                    <Link to="/friends" className="flex items-center text-gray-300 hover:text-white transition">
                        <Users className="mr-3" /> Friends
                    </Link>
                    <Link to="/search" className="flex items-center text-gray-300 hover:text-white transition">
                        <Search className="mr-3" /> Search
                    </Link>
                </nav>
            </div>

            <div className="px-6 py-4 border-t border-gray-800 flex-1 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Playlists</h3>
                    <button 
                        onClick={() => setIsCreating(!isCreating)}
                        className="text-gray-400 hover:text-white"
                        title="Create Playlist"
                    >
                        ＋
                    </button>
                </div>

                {isCreating && (
                    <form onSubmit={handleCreatePlaylist} className="mb-4">
                        <input
                            type="text"
                            value={newPlaylistName}
                            onChange={(e) => setNewPlaylistName(e.target.value)}
                            placeholder="Playlist name..."
                            className="w-full bg-gray-800 text-sm text-white px-2 py-1 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                            autoFocus
                        />
                    </form>
                )}

                <ul className="space-y-2">
                    {playlists.map(playlist => (
                        <li key={playlist.id}>
                            <Link 
                                to={`/playlist/${playlist.id}`}
                                className="text-sm text-gray-400 hover:text-white block truncate transition"
                            >
                                {playlist.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
            
            <div className="p-4 border-t border-gray-800">
               {user && (
                   <div className="text-xs text-gray-500">
                       Logged in as <span className="text-white">{user.username || "User"}</span>
                   </div>
               )}
            </div>
        </div>
    );
};

export default Sidebar;
