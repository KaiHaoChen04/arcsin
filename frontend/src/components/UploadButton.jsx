import React, { useRef } from 'react';
import { toast } from 'react-toastify';

const UploadButton = ({ onUploadSuccess }) => {
    const fileInputRef = useRef(null);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/tracks/upload', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const track = await response.json();
                toast.success(`Uploaded: ${track.title}`);
                onUploadSuccess?.();
            } else if (response.status === 415) {
                toast.error('Unsupported file type. Use MP3, WAV, OGG, or FLAC.');
            } else {
                toast.error('Upload failed. Please try again.');
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Upload failed. Please try again.');
        }

        // Reset input so same file can be uploaded again
        e.target.value = '';
    };

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".mp3,.wav,.ogg,.flac"
                style={{ display: 'none' }}
            />
            <button
                onClick={handleClick}
                className="text-white font-semibold py-2 px-4 rounded-full transition-colors flex items-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Upload Music
            </button>
        </>
    );
};

export default UploadButton;
