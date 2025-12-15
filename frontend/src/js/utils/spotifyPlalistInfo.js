const VITE_SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const VITE_SPOTIFY_CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
const VITE_SPOTIFY_REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
const VITE_SPOTIFY_SCOPE = import.meta.env.VITE_SPOTIFY_SCOPE;
const VITE_SPOTIFY_AUTH_URL = import.meta.env.VITE_SPOTIFY_AUTH_URL;

export async function playlistData(val) {
  if (!validateInput(val)) {
    alert("Invalid playlist url");
    return;
  }
  const localToken = localStorage.getItem("token");
  
  if(!localToken || localToken === "undefined"){
    await getToken();
  }

  let playlistId = extractPlaylistId(val);
  let playlistinfo = await getPlaylistInfo(playlistId);

  return playlistinfo;
}

export async function getToken() {
  const urlParams = new URLSearchParams(window.location.search);
  let code = urlParams.get("code");
  let codeVerifier = localStorage.getItem("code_verifier");

  const payload = {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: VITE_SPOTIFY_CLIENT_ID,
      grant_type: "authorization_code",
      code,
      redirect_uri: VITE_SPOTIFY_REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
  };
  const body = await fetch("https://accounts.spotify.com/api/token", payload);
  const response = await body.json();

  console.log(response);

  localStorage.removeItem("token")
  localStorage.removeItem("refresh_token")

  localStorage.setItem("token", response.access_token);
  localStorage.setItem("refresh_token", response.refresh_token);
}

async function refreshToken() {
  const refreshToken = localStorage.getItem("refresh_token");

  if (!refreshToken) {
    console.error("No refresh token found. User needs to log in again.");
    return;
  }

  const payload = {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: VITE_SPOTIFY_CLIENT_ID,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  };

  const response = await fetch(
    "https://accounts.spotify.com/api/token",
    payload
  );
  const data = await response.json();

  if (data.access_token) {
    localStorage.removeItem("token");
    localStorage.setItem("token", data.access_token);
    console.log("Access token refreshed:", data.access_token);
  } else {
    console.error("Failed to refresh token:", data);
  }
}

async function getPlaylistInfo(playlistId) {
  let token = localStorage.getItem("token");

  if (!token) {
    console.error("No access token found. Refreshing token...");
    await refreshToken();
    token = localStorage.getItem("token");
  }

  const infoResponse = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const songsResponse = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const info = await infoResponse.json();
  const songs = await songsResponse.json();

  const returnData = {
    coverImage: info.images[0].url,
    name: info.name,
    description: info.description,
    followers: info.followers.total,
    owner: info.owner.display_name,
    tracks: songs.items.map((song) => {
      return {
        songName: song.track.name,
        artist: song.track.artists[0].name,
        uri: song.track.uri,
      };
    }),
  };

  return returnData;
}

function extractPlaylistId(playlistUrl) {
  // "https://open.spotify.com/playlist/1OgdpTEcFoZ8x4ChQjjB30?si=1bd5f97a34c749ee"
  let urlParts = playlistUrl.split("/");
  let playlistId = urlParts[urlParts.length - 1].split("?")[0];
  return playlistId;
}

function validateInput(playlistUrl) {
  let urlParts = playlistUrl.split("/");
  if (urlParts.length < 5) {
    return false;
  }
  return true;
}

const base64encode = (input) => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
};

function scheduleTokenRefresh(expiresIn) {
  setTimeout(() => {
    refreshToken();
  }, (expiresIn - 100) * 1000); // Refresh 100 seconds before expiration
}

// Example usage after login
const expiresIn = 3600; // Replace with the actual `expires_in` value from Spotify
scheduleTokenRefresh(expiresIn);
