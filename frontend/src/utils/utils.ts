export class Utils {
    generateRandomString(length: number) {
        const possible =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        const values = window.crypto.getRandomValues(new Uint8Array(length));
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

    validateInput(playlistUrl) {
        let urlParts = playlistUrl.split("/");
        if (urlParts.length < 5) {
            return false;
        }
        return true
    }

    extractPlaylistId (playlistUrl) {
        // "https://open.spotify.com/playlist/1OgdpTEcFoZ8x4ChQjjB30?si=1bd5f97a34c749ee"
        let urlParts = playlistUrl.split("/");
        let playlistId = urlParts[urlParts.length - 1].split("?")[0];
        return playlistId;
    }
}