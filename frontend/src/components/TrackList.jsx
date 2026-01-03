import React from 'react';

const TrackList = ({ tracks, onSelect, currentTrackId }) => {
    return (
        <div className="pb-24 pt-8 px-4 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-white">Tracks</h1>
            <div className="space-y-2">
                {tracks.map((track) => (
                    <div 
                        key={track.id}
                        onClick={() => onSelect(track)}
                        className={`p-3 rounded-lg cursor-pointer flex items-center justify-between transition-colors ${
                            currentTrackId === track.id 
                                ? "bg-purple-900/50 text-purple-200" 
                                : "hover:bg-gray-800 text-gray-300"
                        }`}
                    >
                        <span>{track.title + " - " + track.artist || track.filename}</span>
                        {/* <span>Duration?</span> */}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TrackList;
