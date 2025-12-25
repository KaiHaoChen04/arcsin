import React from "react"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"

const Header = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    }

  return (
    <div>
      <div className="flex justify-between items-center w-full h-16 bg-gray-800 text-white px-6">
        <h1 className="text-xl font-bold">ArcSin</h1>
        <div className="flex space-x-4">
            <button className="hover:text-gray-300">Home</button>
            <button className="hover:text-gray-300">Tracks</button>
            <button className="hover:text-gray-300">Playlists</button>
            <button className="hover:text-gray-300">Settings</button>
            {user ? (
                <button onClick={handleLogout} className="hover:text-gray-300 text-red-400">Logout</button>
            ) : (
                <button onClick={() => navigate("/login")} className="hover:text-gray-300 text-purple-400">Login</button>
            )}
        </div>
      </div>
    </div>
  )
};

export default Header;
