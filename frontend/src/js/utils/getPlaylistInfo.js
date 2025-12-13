import * as spotifyPlaylistData from "./spotifyPlalistInfo";

export default async function getPlaylistInfo(playlistUrl){
    const playlistInfo = await spotifyPlaylistData.playlistData(JSON.stringify(playlistUrl))
    console.log(playlistInfo)
    return playlistInfo
}