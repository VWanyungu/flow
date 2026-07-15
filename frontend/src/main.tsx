import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import App from "./App";
import Login from "./pages/Login";
import { AuthProvider } from "./contexts/Auth";
import { SpotifyProvider } from "./hooks/useSpotify";
import { Toaster } from "sonner";

createRoot(document.getElementById("root")).render(
  // <StrictMode>
    <BrowserRouter>
      <Toaster/>
        <AuthProvider>
          <SpotifyProvider>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/dashboard" element={<App />} />
            </Routes>
          </SpotifyProvider>
        </AuthProvider>      
    </BrowserRouter>
  // </StrictMode>
);
