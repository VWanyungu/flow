
class SpotifyAuth {
  constructor() {
    this.REACT_APP_SPOTIFY_CLIENT_ID = "41217831f42a45ffa6c96d4dc51b4c61";
    this.REACT_APP_SPOTIFY_CLIENT_SECRET = "9066c749df1e4546a493cde2466bfa5c";
    this.REACT_APP_SPOTIFY_REDIRECT_URI = "http://localhost:5173";
    this.REACT_APP_SPOTIFY_SCOPE =
      "user-read-private user-read-email playlist-modify-public playlist-modify-private";
    this.REACT_APP_SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
  }

  async authorisation() {
    console.log("Starting Spotify authorization...");

    const codeVerifier = this.generateRandomString(64);
    const hashed = await this.sha256(codeVerifier);
    const codeChallenge = this.base64encode(hashed);
    const authUrl = new URL("https://accounts.spotify.com/authorize");

    window.localStorage.setItem("code_verifier", codeVerifier);

    const params = {
      response_type: "code",
      client_id: this.REACT_APP_SPOTIFY_CLIENT_ID,
      scope: this.REACT_APP_SPOTIFY_SCOPE,
      code_challenge_method: "S256",
      code_challenge: codeChallenge,
      redirect_uri: this.REACT_APP_SPOTIFY_REDIRECT_URI,
    };
    authUrl.search = new URLSearchParams(params).toString();
    window.location.href = authUrl.toString();
  }

  generateRandomString(length) {
    console.log("Generating random string for code verifier...");

    const possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const values = window.crypto.getRandomValues(new Uint8Array(length));

    console.log(values)

    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
  }

  base64encode(input) {
    return btoa(String.fromCharCode(...new Uint8Array(input)))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  }

  async sha256(plain) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return window.crypto.subtle.digest("SHA-256", data);
  }
}

export default SpotifyAuth;
