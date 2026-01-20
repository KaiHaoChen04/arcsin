import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import TrackList from '../components/TrackList';
import { useOutletContext } from 'react-router-dom';
import { MoreHorizontal, Trash2} from 'lucide-react';
import { usePlaylist } from '../context/PlaylistContext';

const Playlist = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [playlist, setPlaylist] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [showMenu, setShowMenu] = useState(false);
    
    const { handleSelectTrack, currentTrackId } = useOutletContext() || {};
    const { deletePlaylist } = usePlaylist();

    const handleDelete = async () => {
        await deletePlaylist(id);
        navigate('/');
    };

    useEffect(() => {
        fetchPlaylist();
    }, [id]);

    const fetchPlaylist = async () => {
        try {
            const res = await axios.get(`http://localhost:3000/api/playlists/${id}`);
            setPlaylist(res.data);
            setTracks(res.data.tracks);
        } catch (error) {
            console.error("Failed to fetch playlist", error);
        }
    };

    if (!playlist) return <div className="p-8 text-white">Loading...</div>;

    return (
        <div className="relative pb-24 pt-8 px-8 max-w-5xl mx-auto h-full overflow-y-auto">
            <div className="absolute top-8 right-8 z-20">
                <button 
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                    <MoreHorizontal className="text-gray-300" />
                </button>
                
                {showMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-[#282828] rounded shadow-xl z-20 overflow-hidden border border-white/10">
                        <button 
                            onClick={handleDelete} 
                            className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-[#3E3E3E] flex items-center gap-2"
                        >
                            <Trash2 size={16} />
                            Delete Playlist
                        </button>
                    </div>
                )}
            </div> 
            
            <div className="flex items-end mb-8 space-x-6">
                <div className="w-48 h-48 bg-gradient-to-br from-purple-700 to-blue-900 shadow-2xl flex items-center justify-center text-6xl shadow-lg">
                    🎵
                </div>
                <div>
                    <h4 className="text-sm font-bold uppercase text-gray-300 mb-2">Playlist</h4>
                    <h1 className="text-5xl font-extrabold text-white mb-4 tracking-tight">{playlist.name}</h1>
                    <p className="text-gray-400">{playlist.description}</p>
                    <p className="text-gray-400 mt-2 text-sm">{tracks.length} songs</p>
                </div>
            </div>

            <TrackList 
                tracks={tracks} 
                onSelect={handleSelectTrack} 
                currentTrackId={currentTrackId}
                playlistId={id}
                onRemove={fetchPlaylist}
            />
        </div>
    );
};

export default Playlist;
