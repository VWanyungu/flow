import { useEffect, useState } from "react";
// import "../css/playlist.css";

function Playlist({ playlistInfo }) {
  return (
     <div
      className="flex pt-5 pb-5 justify-start"
      style={{ height: "214px" }}
    >
      <img src={playlistInfo.coverImage} alt="playlist cover image" />
      <div
        className="ml-3 h-full flex flex-col justify-between"
        style={{ height: "100%" }}
      >
        <h1 className="text-lg m-0 p-0 font-semibold">{playlistInfo.name}</h1>
        <div>
          <h4 className="text-gray-500 text-base">{playlistInfo.description}</h4>
          <h4 className="text-gray-500 text-base">{playlistInfo.followers} Followers</h4>
          <h4 className="text-gray-500 text-base m-0 p-0">By {playlistInfo.owner}</h4>
        </div>
      </div>
    </div>
  );
}

export default Playlist;
