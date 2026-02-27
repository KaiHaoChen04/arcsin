import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { Search as SearchIcon } from "lucide-react";
import { toast } from "react-toastify";
import TrackList from "../components/TrackList";

const Search = () => {
	const [tracks, setTracks] = useState([]);
	const [query, setQuery] = useState("");
	const [loading, setLoading] = useState(false);
	const [hasSearched, setHasSearched] = useState(false);
	const inputRef = useRef(null);
	const { handleSelectTrack, currentTrackId } = useOutletContext() || {};

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	useEffect(() => {
		const handleKeyDown = (e) => {
			if (e.code === "Enter" && e.target === inputRef.current) {
				e.preventDefault();
				searchForTracks();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [query]);

	const searchForTracks = async () => {
		const trimmed = query.trim();
		if (!trimmed) return;

		setLoading(true);
		setHasSearched(true);
		try {
			const result = await axios.get(
				`/api/search/${encodeURIComponent(trimmed)}`, // encode to fit url 
			);
			setTracks(result.data);
		} 
		catch (error) {
			console.error("Error occurred: ", error);
			toast.error("Search failed", { toastId: "search-failed" });
		} 
		finally {
			setLoading(false);
		}
	};

	const onSelect = (track) => {
		if (handleSelectTrack) {
			handleSelectTrack(track, tracks);
		}
	};

	return (
		<div className="p-8 max-w-5xl mx-auto text-white">
			<h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
				<SearchIcon className="text-white-500" size={32} />
				Search
			</h1>

			{/* Search Input */}
			<div className="bg-[#181818] p-6 rounded-lg mb-8 shadow-lg">
				<div className="flex gap-4">
					<input
						ref={inputRef}
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search tracks "
						className="flex-1 bg-[#282828] border border-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:border-purple-500 transition-colors"
					/>
					<button
						onClick={searchForTracks}
						disabled={loading || !query.trim()}
						className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
					>
						{loading ? (
							"Searching..."
						) : (
							<>
								<SearchIcon size={18} /> Search
							</>
						)}
					</button>
				</div>
			</div>

			{/* Results */}
			{loading && (
				<div className="text-gray-400 text-center py-8">
					Searching...
				</div>
			)}

			{!loading && hasSearched && tracks.length === 0 && (
				<div className="text-gray-500 text-center py-8 bg-[#181818] rounded-lg">
					No tracks found. Try a different search term.
				</div>
			)}

			{!loading && tracks.length > 0 && (
				<div>
					<h2 className="text-xl font-semibold mb-4 text-gray-200">
						Results ({tracks.length})
					</h2>
					<TrackList
						tracks={tracks}
						onSelect={onSelect}
						currentTrackId={currentTrackId}
					/>
				</div>
			)}

			{!hasSearched && !loading && (
				<div className="text-gray-500 text-center py-16">
					<SearchIcon size={48} className="mx-auto mb-4 opacity-30" />
					<p>Search for your favorite tracks</p>
				</div>
			)}
		</div>
	);
};

export default Search;
