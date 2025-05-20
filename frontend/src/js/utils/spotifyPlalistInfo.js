const REACT_APP_SPOTIFY_CLIENT_ID = "41217831f42a45ffa6c96d4dc51b4c61";
const REACT_APP_SPOTIFY_CLIENT_SECRET = "9066c749df1e4546a493cde2466bfa5c";
const REACT_APP_SPOTIFY_REDIRECT_URI = "http://localhost:5173";
const REACT_APP_SPOTIFY_SCOPE =
  "user-read-private user-read-email playlist-modify-public playlist-modify-private";
const REACT_APP_SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";

export async function playlistData(val) {
  if (!validateInput(val)) {
    alert("Invalid playlist url");
    return;
  }
  await getToken();
  let playlistId = extractPlaylistId(val);
  let playlistinfo = await getPlaylistInfo(playlistId);

  return playlistinfo;
}

export async function getToken() {
  let configResponse = await fetch("http://localhost:5000/config")
    .then((response) => response.json())
    .then((data) => data);
  let config = configResponse.config;

  const urlParams = new URLSearchParams(window.location.search);
  let code = urlParams.get("code");
  let codeVerifier = localStorage.getItem("code_verifier");

  const payload = {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: config.REACT_APP_SPOTIFY_CLIENT_ID,
      grant_type: "authorization_code",
      code,
      redirect_uri: config.REACT_APP_SPOTIFY_REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
  };
  const body = await fetch("https://accounts.spotify.com/api/token", payload);
  const response = await body.json();

  console.log(response);

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
      client_id: REACT_APP_SPOTIFY_CLIENT_ID,
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
    localStorage.setItem("token", data.access_token);
    console.log("Access token refreshed:", data.access_token);
  } else {
    console.error("Failed to refresh token:", data);
  }
}

async function getPlaylistInfo(playlistId) {
  const token = localStorage.getItem("token");

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
