import { useEffect } from "react";
import { NavLink } from "react-router";
import SpotifyAuth from "../js/utils/spotifyAuth.js";
const sa = new SpotifyAuth();

function Login() {
  async function authorize() {
    localStorage.clear();
    await sa.authorisation();
  }

  useEffect(() => {
    let verifier = localStorage.getItem("code_verifier");
    verifier && (window.location.href = "/dashboard");
  }, []);

  return (
    <div className="bg-black relative">
      <div
        className="
            absolute top-[35%] left-[35%] 
            z-50 
            bg-gray-800 
            ring-1 ring-gray-600
            shadow-lg shadow-gray-700
            opacity-100 
            flex flex-col items-center justify-center 
            pt-10
            rounded-lg
            "
      >
        <div className="mx-10 text-center">
          <h1 className="text-yellow-500 text-4xl font-extrabold mb-12">
            Flow
          </h1>
          <h1
            className="font-bold text-3xl mb-15 text-white"
            onClick={authorize}
          >
            Sign in to Spotify to continue
          </h1>
        </div>

        <button
          className="
                text-xl w-full 
                bg-yellow-500 hover:bg-yellow-600 
                text-white font-bold
                rounded-lg
                py-6 mx-30
                cursor-pointer
                transition-all duration-300 ease-in
            "
        >
          Authorize
        </button>
      </div>
      <div
        className="
            bg-[url(/david-pupaza-Km5J-KCP1Mw-unsplash.jpg)] bg-cover bg-center 
            h-screen
            opacity-25
            z-10
            flex items-center justify-center
            "
      >
        {/* Background content */}
      </div>
    </div>
  );
}

export default Login;
