import { useEffect, useState } from "react";
// import "../css/input.css";
import * as spotifyPlaylistData from "../js/utils/spotifyPlalistInfo";

function Input({
  btnTitle,
  setPlaylistInfo,
  generatePlaylist,
  placeholderText,
}) {
  const handleClick = async () => {
    let input = document.querySelector("input");
    let playlistInfo = await spotifyPlaylistData.playlistData(input.value);
    setPlaylistInfo(playlistInfo);
    generatePlaylist(playlistInfo, playlistInfo.name);
  };
// https://open.spotify.com/playlist/63aZTYYeFIKlZlHFx08lVS?si=4fc029fa88754c4d
  return (
    <>
      <div className="grid items-start m-0 p-0">
        <div className="flex flex-row m-0 p-0 w-full">
          <input
            className="flex-1 p-4 pt-3 pb-3 mr-4 mt-3 rounded text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="text"
            name=""
            id=""
            placeholder={placeholderText}
          />
          <button
            id="submitBtn"
            className="w-1/4 bg-gray-900 text-white p-5 pt-3 pb-3 mt-3 rounded hover:bg-gray-800 transition-colors duration-200"
            onClick={handleClick}
          >
            {btnTitle}
          </button>
        </div>
      </div>
    </>
  );
}

export default Input;
