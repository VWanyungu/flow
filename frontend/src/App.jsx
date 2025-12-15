import Title from "./pages/Title";
import Input from "./pages/Input";
import Playlist from "./pages/Playlist";
import { FaCheckCircle } from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import * as spotifyCreatePlaylist from "./js/utils/spotifyCreatePlaylist";
import getPlaylistInfo from "./js/utils/getPlaylistInfo"
import {getToken} from "./js/utils/spotifyPlalistInfo"
import SpotifyAuth from "./js/utils/spotifyAuth";
const spotifyAuth = new SpotifyAuth();
import { useEffect, useState } from "react";

function App() {
  const heading = "Flow";
  const subheading = "Buttery smooth transitions";
  const logo = "src/assets/calibreLogo.png";

 const [playlistCreated, setPlaylistCreated] = useState(false);
 const [createdPlaylistId, setCreatedPlaylistId] = useState("");
 const [playlistInfo, setPlaylistInfo] = useState({
    coverImage: '/david-pupaza-Km5J-KCP1Mw-unsplash.jpg'
 });

 const [status, setStatus] = useState({
    loading: false,
    fetchPlaylist: false,
    downloadComplete: false,
    analyzingComplete: false,
    comparingComplete: false,
    optimizingComplete: false,
    playlistCreated: false,
 });

  const handleOpenSpotifyPlaylist = () => {
    setPlaylistCreated(false);
    setCreatedPlaylistId("");
    setPlaylistInfo(null);

    setDownloadComplete(false);
    setAnalyzingComplete(false);
    setComparingComplete(false);
    setOptimizingComplete(false);
  };

  const playlistSearch = async (playlistUrl) => {
    setStatus({...status, loading: true})
    const playlistInfo = await getPlaylistInfo(playlistUrl);
    setPlaylistInfo(playlistInfo)
    setStatus({ ...status, fetchPlaylist: true });
    setStatus({...status, loading: false})
    getOptimizedPlaylist(playlistInfo, playlistInfo.name);    
  }

  const auth = async () => {
    await spotifyAuth.authorisation();
  }

  async function getOptimizedPlaylist(playlist, playlistName) {
    // https://open.spotify.com/playlist/63aZTYYeFIKlZlHFx08lVS?si=36b17986ef81432f
    setStatus({ ...status, downloadComplete: false, analyzingComplete: false, comparingComplete: false, optimizingComplete: false, playlistCreated: false });

    let tracks = playlist.tracks;
    let downloadResponse = await request(tracks, "download");
    setStatus({ ...status, downloadComplete: downloadResponse.error ? false : true });

    console.log("downloadResponse", downloadResponse)

    let songsResponse = await request(tracks, "analyse");
    let songs = songsResponse.songs;
    setStatus({ ...status, analyzingComplete: songsResponse.error ? false : true });

    console.log("analyse", songs)

    let graphResponse = await request(songs, "graph");
    let graph = graphResponse.graph;
    setStatus({ ...status, comparingComplete: graphResponse.error ? false : true });

    console.log("graph", graph)

    let mstResponse = await request(graph, "mst");
    let mst = mstResponse.mst;
    setStatus({ ...status, optimizingComplete: mstResponse.error ? false : true });

    console.log("mst", mst)

    if(mst != undefined){
      let createdPlaylistId = await spotifyCreatePlaylist.createPlaylist(mst,playlistName);
      setStatus({...status, createPlaylist: true})
      setCreatedPlaylistId(createdPlaylistId);
    }
  }

  return (
    <div className="h-dvh bg-[url(/david-pupaza-Km5J-KCP1Mw-unsplash.jpg)] bg-cover bg-center relative text-white">
      <div className="absolute inset-0 bg-black opacity-60 z-0"></div>
      <div className="relative z-10">
        <div className="w-full p-8 flex justify-between align-middle" id="menuBar">
          <img
            className="p-0 m-0"
            src="src/assets/calibreLogo.png"
            alt="logo"
            style={{ border: "1px solid black", height: "60px", width: "60px" }}
          />
          <button
            className="h-max py-2 px-6 bg-orange-400 hover:bg-orange-400 text-white font-bold cursor-pointer transition-all duration-300 ease-in"
            onClick={auth}
          >
            Authorize
          </button>
        </div>

        <div className="flex flex-col gap-4 align-middle justify-start items-center text-center p-8">
          <p className="text-sm py-1 px-3 rounded-2xl bg-orange-400 text-white w-max">Better listening</p>
          <h2 className="text-7xl font-bold">Smoother transitions</h2>
          <p className="text-3xl">A new way to experience your playlists</p>

          <div className="flex gap-5 w-[50%]">
            <input type="text" className="w-full bg-orange-400 border-2 border-black text-xl py-2 px-4 cursor-text" placeholder="Paste your playlist here" id="playlistUrl" />
            <button className="w-[25%] bg-black text-white py-2 px-4 text-xl cursor-pointer border-1 border-white flex items-center justify-center"
             onClick={() => playlistSearch(document.querySelector("#playlistUrl").value)}>
              {status.loading ? 
                 (<svg class="size-5 animate-spin" viewBox="0 0 20 20">
                  <AiOutlineLoading3Quarters />
                </svg>) : "Smoothify"}
            </button>
          </div>

          <div className="flex justify-center align-middle items-start pt-10 pb-10 gap-3">

            <div className="flex flex-col items-center w-96">
              <p class={`font-bold text-white rounded-full ${status.fetchPlaylist ? "bg-orange-400" : "bg-gray-300"} flex items-center justify-center p-2 text-sm`}>01</p>
              <p className={`text-base mt-2 font-semibold ${status.fetchPlaylist ? "text-orange-400" : "text-gray-300"}`}>Fetch playlist</p>

              <div
                className="relative w-full h-60 rounded overflow-hidden mt-2 p-6 border-1 border-white"
                style={{
                  backgroundImage: `url('${playlistInfo.coverImage}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {/* Black overlay */}
                <div className="absolute inset-0 bg-black opacity-10"></div>
                {/* Text content */}
                <div className="relative flex justify-between z-10 h-full text-white">
                  <div className="flex flex-col items-start justify-end">
                      <h3 className="text-2xl font-bold">Brake</h3>
                      <p className="text-base mt-1">Amboka</p>
                  </div>
                  <div>
                      <a href="#" className="rounded-full bg-white text-orange-400 p-2 text-xs">Go to playlist</a>
                  </div>
                </div>
              </div>
            </div>

            <div className={`border-t-1 border-dashed ${status.fetchPlaylist ? "border-orange-400" : "border-gray-300"} h-2 mt-8 w-[10%]`}></div>

            <div className="flex flex-col items-center w-96">
              <p class={`font-bold text-white rounded-full bg-gray-300 ${status.optimizingComplete ? "bg-orange-400" : "bg-gray-300"} flex items-center justify-center p-2 text-sm`}>02</p>
              <p className={`text-base mt-2 font-semibold text-gray-300 ${status.optimizingComplete ? "text-orange-400" : "text-gray-300"}`}>Smoothify</p>

              <div
                className="relative w-full h-60 rounded overflow-hidden mt-2 px-4 border-1 border-white"
                style={{
                  backgroundImage: "url('/david-pupaza-Km5J-KCP1Mw-unsplash.jpg')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {/* Black overlay */}
                <div className="absolute inset-0 bg-black opacity-90"></div>
                {/* Text content */}
                <div className="relative z-10 flex flex-col items-center justify-center h-full text-white">
                  <div>
                    <div className={`flex items-center gap-2 ${status.downloadComplete ? "text-orange-400" : "text-gray-500"}`}>
                      <FaCheckCircle />
                      <p className="text-base">Downloading</p>
                    </div>
                    <div className={`flex items-center gap-2 ${status.analyzingComplete ? "text-orange-400" : "text-gray-500"}`}>
                      <FaCheckCircle />
                      <p className="text-base">Analysing</p>
                    </div>
                    <div className={`flex items-center gap-2 ${status.comparingComplete ? "text-orange-400" : "text-gray-500"}`}>
                      <FaCheckCircle />
                      <p className="text-base">Comparing</p>
                    </div>
                    <div className={`flex items-center gap-2 ${status.optimizingComplete ? "text-orange-400" : "text-gray-500"}`}>
                      <FaCheckCircle />
                      <p className="text-base">Optimizing</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`border-t-1 border-dashed ${status.optimizingComplete ? "border-orange-400" : "border-gray-300"} h-2 mt-8 w-[10%]`}></div>

            <div className="flex flex-col items-center w-96">
              <p class={`font-bold text-white rounded-full bg-gray-300 ${status.playlistCreated ? "bg-orange-400" : "bg-gray-300"} flex items-center justify-center p-2 text-sm`}>03</p>
              <p className={`text-base mt-2 font-semibold text-gray-300 ${status.playlistCreated ? "text-orange-400" : "text-gray-300"}`}>Create new playlist</p>

              <div
                className="relative w-full h-60 rounded overflow-hidden mt-2 p-6 border-1 border-white"
                style={{
                  backgroundImage: `url('${playlistInfo.coverImage}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {/* Black overlay */}
                <div className="absolute inset-0 bg-black opacity-10"></div>
                {/* Text content */}
                <div className="relative flex justify-between z-10 h-full text-white">
                  <div className="flex flex-col items-start justify-end">
                      <h3 className="text-2xl font-bold">Brake</h3>
                      <p className="text-base mt-1">Amboka</p>
                  </div>
                  <div>
                      <a href={`https://open.spotify.com/playlist/${createdPlaylistId}`} className="rounded-full bg-white text-orange-400 p-2 text-xs">Go to playlist</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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
