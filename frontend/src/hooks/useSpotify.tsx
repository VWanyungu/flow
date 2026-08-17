import { createContext, useContext, useEffect, useState } from "react"
import { Utils } from "../utils/utils.js"
import { useAuth } from "../contexts/Auth.js"
import { useRequest } from "./useRequest.js"
import { toast } from "sonner"

const utils = new Utils()

const PlaylistContext = createContext(null)

export const SpotifyProvider = ({children}) => {
    const { logout, user } = useAuth()
    const { httpRequest } = useRequest()

    const [playlistInfo, setPlaylistInfo] = useState({})
    const [playlistUrl, setPlaylistUrl] = useState('')
    const [createdPlaylistId, setCreatedPlaylistId] = useState('')

    const getPlaylistInfo = async (url: string) => {
        if (!utils.validateInput(url)) {
            alert("Invalid playlist url");
            return;
        }

        setPlaylistUrl(url)

        const token = localStorage.getItem("token");
        
        if(!token || token === "undefined"){
            logout()
        }
        
        let playlistId = utils.extractPlaylistId(url);

        const infoResponse = await httpRequest(
            `https://api.spotify.com/v1/playlists/${playlistId}`,
            {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
            }
        );

        const songsResponse = await httpRequest(
            `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
            {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
            }
        );



        const info = await infoResponse.data
        const songs = await songsResponse.data

        if (infoResponse.status != "success"){
            toast.error("Error getting playlist info")
        }

        if (songsResponse.status != "success"){
            toast.error("Error getting playlist songs")
        }

        const playlistData = {
            coverImage: info.images[0].url || null,
            name: info.name || "",
            description: info.description || "",
            followers: info.followers.total || 0,
            owner: info.owner.display_name || "",
            tracks: songs.items.map((song) => {
                return {
                    songName: song.track.name,
                    artist: song.track.artists[0].name,
                    uri: song.track.uri,
                };
            }) || [],
        };

        setPlaylistInfo(playlistData)
        return playlistData
    }

    const createPlaylist = async (songs: string[], playlistName: string) => {
        const userId = user.id

        const createPlaylistLayload = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
                "name": `${playlistName} - Flow`,
                "description": "Optimized for transitions",
                "public": false,
            }),
        };

        const createBody = await httpRequest(`https://api.spotify.com/v1/users/${userId}/playlists`, createPlaylistLayload);

        let playlistId = createBody.data.id

        // Add songs to the playlist
        const addSongsPayload = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
                "uris" : songs
            }),
        }
        const addBody = await httpRequest(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, addSongsPayload);

        setCreatedPlaylistId(playlistId)
        return playlistId
    }

    const value = {
        playlistInfo,
        playlistUrl,
        getPlaylistInfo,
        createPlaylist,
        createdPlaylistId
    }

    return (
        <PlaylistContext.Provider value={value}>
            {children}
        </PlaylistContext.Provider>
    )
}

export const useSpotify = () => {
    const ctx = useContext(PlaylistContext)
    return ctx
}