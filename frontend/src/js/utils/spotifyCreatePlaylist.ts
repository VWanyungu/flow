export async function createPlaylist(songs, playlistName) {
    // Songs is an array of spotify URIs
    // Get the user's ID
    let userId = "";
    const response = await fetch(
        "https://api.spotify.com/v1/me",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      )
      const user = await response.json();
      userId = user.id;

      // Create a new playlist
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
      const createBody = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, createPlaylistLayload);
      const createPlaylistResponse = await createBody.json();
      let playlistId = createPlaylistResponse.id;

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
      const addBody = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, addSongsPayload);
      const addResponse = await addBody.json();

      console.log("response from add songs to playlist Playlist");

      return playlistId
}