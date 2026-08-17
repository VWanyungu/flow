import { createContext, useContext, useEffect, useState } from "react";
import { Utils } from "../utils/utils.js";
import { useRequest } from "../hooks/useRequest.js";

const utils = new Utils()

const AuthContext = createContext(null)

interface ReturnData {
  status: "success" | "error";
  data: any;
  error: any;
}

const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID
const SPOTIFY_CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET
const SPOTIFY_REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI
const SPOTIFY_SCOPE = import.meta.env.VITE_SPOTIFY_SCOPE
const SPOTIFY_AUTH_URL = import.meta.env.VITE_SPOTIFY_AUTH_URL

export const AuthProvider = ({children}) => {
    const [isAuthorized, setIsAuthorized] = useState(false)
    const [user, setUser] = useState({})
    const { httpRequest } = useRequest()

    const authorize = async () => {
        const codeVerifier = utils.generateRandomString(64);
        const hashed = await utils.sha256(codeVerifier);
        const codeChallenge = utils.base64encode(hashed);
        const authUrl = new URL(SPOTIFY_AUTH_URL);

        window.localStorage.setItem("code_verifier", codeVerifier);

        const params = {
            response_type: "code",
            client_id: SPOTIFY_CLIENT_ID,
            scope: SPOTIFY_SCOPE,
            code_challenge_method: "S256",
            code_challenge: codeChallenge,
            redirect_uri: SPOTIFY_REDIRECT_URI,
        };

        authUrl.search = new URLSearchParams(params).toString();
        window.location.href = authUrl.toString();
    }

    const getToken = async (): Promise<ReturnData> => {
        try {
            let code = localStorage.getItem("code")
            let codeVerifier = localStorage.getItem("code_verifier");

            const payload = {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    client_id: SPOTIFY_CLIENT_ID,
                    grant_type: "authorization_code",
                    code,
                    redirect_uri: SPOTIFY_REDIRECT_URI,
                    code_verifier: codeVerifier,
                }),
            };

            const tokenBody = await httpRequest("https://accounts.spotify.com/api/token", payload);

            localStorage.removeItem("token")
            localStorage.removeItem("refresh_token")

            localStorage.setItem("token", tokenBody.data.access_token);
            localStorage.setItem("refresh_token", tokenBody.data.refresh_token);

            return {
                status: "success",
                data: null,
                error: null
            }

        }catch (error){
            return {
                status: "error",
                data: null,
                error: error
            }
        }
    }

    const refreshToken = async (): Promise<ReturnData> => {
        const refreshToken = localStorage.getItem("refresh_token");

        if (!refreshToken) {
            console.error("No refresh token found. User needs to log in again.");
            return;
        }

        const payload = {
            method: "POST",
            headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
            client_id: SPOTIFY_CLIENT_ID,
            grant_type: "refresh_token",
            refresh_token: refreshToken,
            }),
        };

        const response = await httpRequest(
            "https://accounts.spotify.com/api/token",
            payload
        );
        const data = await response.data

        if (data.access_token) {
            localStorage.removeItem("token");
            localStorage.setItem("token", data.access_token);
            console.log("Access token refreshed:", data.access_token);
        } else {
            console.error("Failed to refresh token:", data);
        }
    }

    const logout = () => {
        localStorage.clear()
        window.location.href = "/"
    }

    const fetchuser = async () => {
        if (!localStorage.getItem('token')){
            setUser({})
            return {}
        }

        const response = await httpRequest(
            "https://api.spotify.com/v1/me",
            {
            method: "GET",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            }
        )
        const res = await response.data
        setUser(res)
        return res
    }

    useEffect(() => {
        fetchuser()
    },[])



    const value = {
        logout,
        authorize,
        isAuthorized,
        getToken,
        refreshToken,
        user
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const ctx = useContext(AuthContext)
    return ctx
}