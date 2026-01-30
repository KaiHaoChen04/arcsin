import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { UserPlus, UserMinus, User } from 'lucide-react';
import { toast } from 'react-toastify';

const Friends = () => {
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newFriendUsername, setNewFriendUsername] = useState('');
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        fetchFriends();
    }, []);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };
    };

    const fetchFriends = async () => {
        try {
            const res = await axios.get("/api/friends", getAuthHeaders());
            setFriends(res.data);
        } catch (error) {
            console.error("Error fetching friends: ", error);
            // specific error handling if needed
        } finally {
            setLoading(false);
        }
    };

    const handleAddFriend = async (e) => {
        e.preventDefault();
        if (!newFriendUsername.trim()) return;

        setAdding(true);
        try {
            await axios.post("/api/friends", { username: newFriendUsername }, getAuthHeaders());
            toast.success("Friend added successfully!");
            setNewFriendUsername('');
            fetchFriends();
        } catch (error) {
            console.error("Error adding friend: ", error);
            toast.error(error.response?.data?.error || "Failed to add friend");
        } finally {
            setAdding(false);
        }
    };

    const handleRemoveFriend = async (friendId) => {
        if (!confirm("Are you sure you want to remove this friend?")) return;

        try {
            await axios.delete(`/api/friends/${friendId}`, getAuthHeaders());
            toast.success("Friend removed");
            setFriends(friends.filter(f => f.id !== friendId));
        } catch (error) {
            console.error("Error removing friend: ", error);
            toast.error("Failed to remove friend");
        }
    };

    if (loading) return <div className="p-8 text-white">Loading friends...</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto text-white">
            <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <UserPlus className="text-purple-500" size={32} />
                Friends
            </h1>

            {/* Add Friend Section */}
            <div className="bg-[#181818] p-6 rounded-lg mb-8 shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-gray-200">Add Friend</h2>
                <form onSubmit={handleAddFriend} className="flex gap-4">
                    <input
                        type="text"
                        value={newFriendUsername}
                        onChange={(e) => setNewFriendUsername(e.target.value)}
                        placeholder="Enter username"
                        className="flex-1 bg-[#282828] border border-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:border-purple-500 transition-colors"
                    />
                    <button
                        type="submit"
                        disabled={adding || !newFriendUsername.trim()}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {adding ? 'Adding...' : <><UserPlus size={18} /> Add</>}
                    </button>
                </form>
            </div>

            {/* Friends List */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4 text-gray-200">Your Friends ({friends.length})</h2>
                
                {friends.length === 0 ? (
                    <div className="text-gray-500 text-center py-8 bg-[#181818] rounded-lg">
                        No friends yet. Add someone above!
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {friends.map(friend => (
                            <div key={friend.id} className="bg-[#181818] p-4 rounded-lg flex items-center justify-between group hover:bg-[#282828] transition-colors border border-transparent hover:border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-lg font-bold">
                                        {friend.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-semibold">{friend.username}</div>
                                        <div className="text-xs text-gray-400">Added just now</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRemoveFriend(friend.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all opacity-0 group-hover:opacity-100"
                                    title="Remove friend"
                                >
                                    <UserMinus size={20} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Friends;