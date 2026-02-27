import axios from "axios";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

const Search = () => {
	[tracks, setTracks] = useState([])
	useEffect(() => {
		const handleKeyDown = (e) => {
			if (e.code === "Enter") {
				e.preventDault();
			}
		};
	});

	const searchForTracks = async (track_id) => {
		try {
			const result = await axios.get('/api/search/${track_id}');
			setTracks(result.data);
		} catch (error) {
			console.error("Error occured: ", error);
			toast.error("Track does not exist", {toastId: "search-failed"});
		}
	}

	return (<div>Search</div>);
};

export default Search;
