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

  return (
    <>
      <div className="grid align-items-start m-0 p-0">
        <div className="row m-0 p-0">
          <input
            className="col-8 p-4 pt-3 pb-3 me-4 mt-3 rounded"
            type="text"
            name=""
            id=""
            placeholder={placeholderText}
          />
          <button
            id="submitBtn"
            className="col-3 btn m-0 text-bg-dark p-5 pt-3 pb-3 mt-3"
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
