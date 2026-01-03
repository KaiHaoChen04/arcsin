import React, { useRef, useEffect } from 'react';
import { SkipBack, SkipForward } from 'lucide-react';

const Player = ({ currentTrack, isPlaying, onPlayPause, onNext, onPrev }) => {
    const audioRef = useRef(null);

    const [currentTime, setCurrentTime] = React.useState(0);
    const [duration, setDuration] = React.useState(0);

    useEffect(() => {
        if (currentTrack) {
            audioRef.current.src = `http://localhost:3000/api/stream/${currentTrack.id}`;
            // Reset state for new track
            setCurrentTime(0);
            setDuration(0);
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

    const handleTimeUpdate = () => {
        setCurrentTime(audioRef.current.currentTime);
    };

    const handleLoadedMetadata = () => {
        setDuration(audioRef.current.duration);
    };

    const handleSeek = (e) => {
        audioRef.current.currentTime = Number(e.target.value);
        setCurrentTime(Number(e.target.value));
    };

    const formatTime = (time) => {
        if (!time) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                onPlayPause();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onPlayPause]);

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4">
            <audio 
                ref={audioRef} 
                onEnded={onNext}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
            />
            <div className="flex flex-col max-w-4xl mx-auto space-y-2">
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                    <span>{formatTime(currentTime)}</span>
                    <input 
                        type="range" 
                        min="0" 
                        max={duration || 0} 
                        value={currentTime} 
                        onChange={handleSeek}
                        className="flex-grow h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                    />
                    <span>{formatTime(duration)}</span>
                </div>

                <div className="flex items-center justify-between">
                    <div className="text-white w-1/3 truncate">
                        {currentTrack ? currentTrack.title + ' - ' + currentTrack.artist : "No track selected"}
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
                        {/* Volume or other controls could go here */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Player;
