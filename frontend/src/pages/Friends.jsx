import { useEffect, useState} from 'react';
import axios from 'axios';

const Friends = () => {
    const [friends, setFriends] = useState([]);

    useEffect(() => {
        fetchFriends();
    }, []);

    const fetchFriends = async () => {
        try {
            const res = await axios.get("/api/friends");
            setFriends(res.data);
        } catch (error) {
            console.log("Error fetching friends: ", error);
        }
    }
    return (

        <div>
            <h1>Friends</h1>
        </div>
    )
}

export default Friends