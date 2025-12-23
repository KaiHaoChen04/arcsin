import React, { useRef, useEffect } from 'react';
import { SkipBack, SkipForward } from 'lucide-react';

const Player = ({ currentTrack, isPlaying, onPlayPause, onNext, onPrev }) => {
    const audioRef = useRef(null);

    useEffect(() => {
        if (currentTrack) {
            audioRef.current.src = `http://localhost:3000/api/stream/${currentTrack.id}`;
            if (isPlaying) {
                audioRef.current.play();
            }
        }
    }, [currentTrack]);

    useEffect(() => {
        if (isPlaying) {
            audioRef.current.play();
        } else {
            audioRef.current.pause();
        }
    }, [isPlaying]);

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4">
            <audio ref={audioRef} onEnded={onNext} />
            <div className="flex items-center justify-between max-w-4xl mx-auto">
                <div className="text-white w-1/3 truncate">
                    {currentTrack ? currentTrack.id : "No track selected"}
                </div>
                <div className="flex items-center space-x-4">
                    <button onClick={onPrev} className="text-gray-400 hover:text-white">
                        <SkipBack />
                    </button>
                    <button 
                        onClick={onPlayPause} 
                        className="bg-white text-black rounded-full p-2 px-4 hover:bg-gray-200"
                    >
                        {isPlaying ? "Pause" : "Play"}
                    </button>
                    <button onClick={onNext} className="text-gray-400 hover:text-white">
                        <SkipForward />
                    </button>
                </div>
                <div className="w-1/3 text-right text-gray-400">
                    {/* Volume or Time could go here */}
                </div>
            </div>
        </div>
    );
};

export default Player;
