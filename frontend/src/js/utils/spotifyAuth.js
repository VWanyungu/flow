
class SpotifyAuth {
  constructor() {
    this.REACT_APP_SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID
    this.REACT_APP_SPOTIFY_CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET
    this.REACT_APP_SPOTIFY_REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI
    this.REACT_APP_SPOTIFY_SCOPE = import.meta.env.VITE_SPOTIFY_SCOPE
    this.REACT_APP_SPOTIFY_AUTH_URL = import.meta.env.VITE_SPOTIFY_AUTH_URL
  }

  async authorisation() {
    console.log("Starting Spotify authorization...");

    const codeVerifier = this.generateRandomString(64);
    const hashed = await this.sha256(codeVerifier);
    const codeChallenge = this.base64encode(hashed);
    const authUrl = new URL(this.REACT_APP_SPOTIFY_AUTH_URL);

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
