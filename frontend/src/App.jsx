import Title from "./pages/Title";
import Input from "./pages/Input";
import Playlist from "./pages/Playlist";
import * as spotifyCreatePlaylist from "./js/utils/spotifyCreatePlaylist";
import { useEffect, useState } from "react";

function App() {
  let heading = "Flow";
  let subheading = "Buttery smooth transitions";
  let logo = "src/assets/calibreLogo.png";

  let [playlistCreated, setPlaylistCreated] = useState(false);
  let [createdPlaylistId, setCreatedPlaylistId] = useState("");
  let [playlistInfo, setPlaylistInfo] = useState(null);

  let [downloadComplete, setDownloadComplete] = useState(false);
  let [analyzingComplete, setAnalyzingComplete] = useState(false);
  let [comparingComplete, setComparingComplete] = useState(false);
  let [optimizingComplete, setOptimizingComplete] = useState(false);

  const handleOpenSpotifyPlaylist = () => {
    setPlaylistCreated(false);
    setCreatedPlaylistId("");
    setPlaylistInfo(null);
    setDownloadComplete(false);
    setAnalyzingComplete(false);
    setComparingComplete(false);
    setOptimizingComplete(false);
  };

  async function getOptimizedPlaylist(playlist, playlistName) {
    // https://open.spotify.com/playlist/5ezrPQJuCCga20VKz72IIk?si=487ff49aa5214a68
    console.log("track processing start");

    let tracks = playlist.tracks;
    let downloadResponse = await request(tracks, "download");
    setDownloadComplete(true);

    let songsResponse = await request(tracks, "analyse");
    let songs = songsResponse.songs;
    setAnalyzingComplete(true);

    let graphResponse = await request(songs, "graph");
    let graph = graphResponse.graph;
    setComparingComplete(true);

    let mstResponse = await request(graph, "mst");
    let mst = mstResponse.mst;
    setOptimizingComplete(true);

    let createdPlaylistId = await spotifyCreatePlaylist.createPlaylist(
      mst,
      playlistName
    );
    setPlaylistCreated(true);
    setCreatedPlaylistId(createdPlaylistId);
  }

  return (
    <div className="container">
      <Title logo={logo} heading={heading} subheading={subheading} />

      <Input
        btnTitle="Smoothify"
        placeholderText="Paste your playlist link here"
        setPlaylistInfo={setPlaylistInfo}
        generatePlaylist={getOptimizedPlaylist}
      />

      {playlistInfo && (
        <div className="d-flex justify-content-start align-items-start">
          <Playlist playlistInfo={playlistInfo} />
          <div className="pt-5 pb-5 m-0 ms-4" style={{ height: "200px" }}>
            <div>
              {downloadComplete ? (
                <p
                  className="m-0 p-0 text-success"
                  style={{ fontWeight: "500" }}
                >
                  1. Downloaded ✔
                </p>
              ) : (
                <p className="m-0 p-0 text-muted" style={{ fontWeight: "500" }}>
                  1. Downloading...
                </p>
              )}
              {analyzingComplete ? (
                <p
                  className="m-0 p-0 text-success"
                  style={{ fontWeight: "500" }}
                >
                  2. Analysed ✔
                </p>
              ) : (
                <p className="m-0 p-0 text-muted" style={{ fontWeight: "500" }}>
                  2. Analysing...
                </p>
              )}
              {comparingComplete ? (
                <p
                  className="m-0 p-0 text-success"
                  style={{ fontWeight: "500" }}
                >
                  3. Compared ✔
                </p>
              ) : (
                <p className="m-0 p-0 text-muted" style={{ fontWeight: "500" }}>
                  3. Comparing...
                </p>
              )}
              {optimizingComplete ? (
                <p
                  className="m-0 p-0 text-success"
                  style={{ fontWeight: "500" }}
                >
                  4. Optimized ✔
                </p>
              ) : (
                <p className="m-0 p-0 text-muted" style={{ fontWeight: "500" }}>
                  4. Optimizing...
                </p>
              )}
              {playlistCreated && (
                <>
                  <p
                    className="m-0 p-0 text-muted"
                    style={{ fontWeight: "500" }}
                  >
                    Playlist created!
                    <a
                      href={`https://open.spotify.com/playlist/${createdPlaylistId}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={handleOpenSpotifyPlaylist}
                    >
                      Open in Spotify
                    </a>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

async function request(data, endpoint) {
  const response = await fetch(`http://localhost:5000/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  const body = await response.json();
  return body;
}

export default App;
