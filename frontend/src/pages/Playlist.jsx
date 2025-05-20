import { useEffect, useState } from "react";
// import "../css/playlist.css";

function Playlist({ playlistInfo }) {
  return (
    <div
      className="d-flex pt-5 pb-5 justify-content-start"
      style={{ height: "214px" }}
    >
      <img src={playlistInfo.coverImage} alt="playlist cover image" />
      <div
        style={{ height: "100%" }}
        className="ms-3 h-100 d-flex flex-column justify-content-between"
      >
        <h1 className="h5 m-0 p-0">{playlistInfo.name}</h1>
        <div>
          <h4 className="text-muted h6">{playlistInfo.description}</h4>
          <h4 className="text-muted h6">{playlistInfo.followers} Followers</h4>
          <h4 className="text-muted h6 m-0 p-0">By {playlistInfo.owner}</h4>
        </div>
      </div>
    </div>
  );
}

export default Playlist;
