import { useEffect } from "react";
import SpotifyAuth from "../js/utils/spotifyAuth";
const sa = new SpotifyAuth();

import { useAuth } from "../contexts/Auth";

function Login() {
  const {authorize, getToken} = useAuth()

  const loginHandler = async () => {
    localStorage.clear()
    await authorize()
  }

  useEffect(() => {
    const fetchToken = async () => {
      const res = await getToken()
      if (res.status === "success"){
        window.location.href = "/dashboard"
      }
    }

    let verifier = localStorage.getItem("code_verifier");

    if( verifier ){
      const urlParams = new URLSearchParams(window.location.search);
      let code = urlParams.get("code");

      localStorage.setItem("code", code)

      fetchToken()
    }
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
          onClick={loginHandler}
        >
          Sign in
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
