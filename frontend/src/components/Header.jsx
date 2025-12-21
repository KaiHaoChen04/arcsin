import React from "react"

const Header = () => {
  return (
    <div>
      <div className="flex justify-between items-center w-full h-16 bg-gray-800 text-white px-6">
        <h1 className="text-xl font-bold">ArcSin</h1>
        <div className="flex space-x-4">
            <button className="hover:text-gray-300">Home</button>
            <button className="hover:text-gray-300">Tracks</button>
            <button className="hover:text-gray-300">Playlists</button>
            <button className="hover:text-gray-300">Settings</button>
            <button className="hover:text-gray-300">Logout</button>
        </div>
      </div>
    </div>
  )
};

export default Header;
