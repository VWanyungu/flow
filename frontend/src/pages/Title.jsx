// import "../css/title.css";
import * as spotifyAuth from "../js/utils/spotifyAuth";

function Title({ logo, heading, subheading }) {
  return (
    <div
      id="titleDiv"
      className="container p-0 mb-0 d-flex flex-column align-items-start justify-content-start"
    >
      <div className="w-100 d-flex justify-content-between align-items-center">
        <img
          className="p-0 m-0"
          src={logo}
          alt="logo"
          style={{ border: "1px solid black", height: "70px", width: "70px" }}
        />
        <button
          className="btn m-0 text-bg-warning p-2 ps-5 pe-5"
          onClick={spotifyAuth.authorisation}
        >
          Authorize
        </button>
      </div>

      <h1 id="heading" className="mt-5">
        {heading}
      </h1>
      <p id="subheading">{subheading}</p>
    </div>
  );
}

export default Title;
