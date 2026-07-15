// import "../css/title.css";
import SpotifyAuth from "../js/utils/spotifyAuth";
const spotifyAuth = new SpotifyAuth();

function Title({ logo, heading, subheading }) {
  return (
    <div
      id="titleDiv"
      className="container p-0 mb-0 flex flex-col align-middle justify-start items-center"
    >
      <div className="w-100 flex justify-between align-middle">
        <img
          className="p-0 m-0"
          src={logo}
          alt="logo"
          style={{ border: "1px solid black", height: "70px", width: "70px" }}
        />
        <button
          className="py-2 px-4 m-0 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg cursor-pointer transition-all duration-300 ease-in"
          onClick={ () => spotifyAuth.authorisation()}
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
