import { FaCheckCircle } from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "./contexts/Auth.js";
import { useSpotify } from "./hooks/useSpotify.js";
import { useRequest } from "./hooks/useRequest.js";
import { toast } from "sonner";

type StatusState = {
  loading: boolean;
  fetchPlaylist: boolean;
  downloadComplete: boolean;
  analyzingComplete: boolean;
  comparingComplete: boolean;
  optimizingComplete: boolean;
  playlistCreated: boolean;
  createPlaylist: boolean;
};

const INITIAL_STATUS: StatusState = {
  loading: false,
  fetchPlaylist: false,
  downloadComplete: false,
  analyzingComplete: false,
  comparingComplete: false,
  optimizingComplete: false,
  playlistCreated: false,
  createPlaylist: false,
};

const STEPS = [
  { number: "01", label: "Fetch" },
  { number: "02", label: "Smoothify" },
  { number: "03", label: "Create" },
] as const;

function App() {
  const { logout, authorize } = useAuth();
  const { httpRequest } = useRequest()
  const { getPlaylistInfo, playlistInfo, createPlaylist, createdPlaylistId } = useSpotify();

  const [form, setForm] = useState({ playlistUrl: "" });
  const [status, setStatus] = useState<StatusState>(INITIAL_STATUS);
  const [activeIndex, setActiveIndex] = useState<0 | 1 | 2>(0)

  // const activeIndex = !status.fetchPlaylist ? 0 : !status.optimizingComplete ? 1 : 2;

  const playlistSearch = async (playlistUrl: string) => {
    setStatus((prev) => ({ ...prev, loading: true }));

    const info = await getPlaylistInfo(playlistUrl);

    setStatus((prev) => ({ ...prev, fetchPlaylist: true, loading: false }));

    // getOptimizedPlaylist(info, info.name);
  };

  async function getOptimizedPlaylist(playlist: any, playlistName: string) {
    setStatus((prev) => ({
      ...prev,
      downloadComplete: false,
      analyzingComplete: false,
      comparingComplete: false,
      optimizingComplete: false,
      playlistCreated: false,
    }));

    setActiveIndex(1)

    let tracks = playlist.tracks;
    let downloadResponse = await httpRequest(`http://localhost:5000/download`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tracks)
    })
    setStatus((prev) => ({ ...prev, downloadComplete: downloadResponse.status === "success" ? true : false }));

    // let songsResponse = await httpRequest(`http://localhost:5000/analyse`, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify(tracks)
    // })
    // let songs = songsResponse.data;
    // setStatus((prev) => ({ ...prev, analyzingComplete: !songsResponse.error }));

    // let graphResponse = await httpRequest(`http://localhost:5000/graph`, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify(songs.songs)
    // })
    // let graph = graphResponse.data;
    // setStatus((prev) => ({ ...prev, comparingComplete: !graphResponse.error }));

    // let mstResponse = await httpRequest(`http://localhost:5000/mst`, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify(graph.graph)
    // })
    // let mst = mstResponse.data;
    // setStatus((prev) => ({ ...prev, optimizingComplete: !mstResponse.error }));
    
    // setActiveIndex(2)

    // if (mst != undefined) {
    //   await createPlaylist(mst.mst, playlistName);
    //   setStatus((prev) => ({ ...prev, playlistCreated: true, createPlaylist: true }));
    //   toast.success("New playlist created successfully")
    // }
  }

  return (
    <div className="min-h-dvh overflow-hidden bg-[url(/david-pupaza-Km5J-KCP1Mw-unsplash.jpg)] bg-cover bg-center relative text-white">
      {/* ambient background image, quieter than before so the UI carries the page */}
      <div className="absolute inset-0 bg-black opacity-90 z-0"></div>
      <div
        className="absolute inset-0 bg-[url(/david-pupaza-Km5J-KCP1Mw-unsplash.jpg)] bg-cover bg-center opacity-[0.12]"
        aria-hidden
      />

      {/* <div className="absolute inset-0 bg-gradient-to-b from-[#0D0D0F] via-[#0D0D0F]/95 to-[#0D0D0F]" aria-hidden /> */}

      <div className="relative z-10">
        {/* Menu bar */}
        <div className="w-full px-8 py-6 flex justify-between items-center">
          <img
            src="src/assets/calibreLogo.png"
            alt="logo"
            className="h-10 w-10  border border-white/20"
          />
          <div className="flex gap-3">
            <button
              onClick={authorize}
              className="py-2 px-5 text-sm font-medium tracking-wide text-[#0D0D0F] bg-[#E8622C] hover:bg-[#F2905A] transition-colors duration-200  cursor-pointer"
            >
              Authorize
            </button>
            <button
              onClick={logout}
              className="py-2 px-5 text-sm font-medium tracking-wide text-[#F5F1E8] border border-white/20 hover:border-white/40 transition-colors duration-200  cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Hero */}
        <div className="flex flex-col items-center text-center px-8 pt-6 pb-4">
          {/* <p className="font-['IBM_Plex_Mono'] text-xs tracking-[0.2em] uppercase py-1.5 px-4  bg-[#E8622C]/15 text-[#F2905A] border border-[#E8622C]/30 w-max">
            Better listening
          </p> */}
          {/* <h2 className="font-['Space_Grotesk'] font-bold text-6xl md:text-7xl mt-6 leading-[1.05]">
            Smoother transitions
          </h2> */}
          <AnimatedHeadline text="Smoother playlists" />

          <p className="text-lg md:text-xl text-[#F5F1E8]/60 mt-4 max-w-md">
            A new way to experience your playlists
          </p>

          <div className="flex gap-3 w-full max-w-xl mt-10">
            <input
              onChange={(e) => setForm({ ...form, playlistUrl: e.target.value })}
              type="text"
              className="w-full bg-white/5 border border-white/15 focus:border-[#E8622C] outline-none  text-base py-3 px-5 placeholder:text-[#F5F1E8]/40 transition-colors duration-200"
              placeholder="Paste your playlist here"
              id="playlistUrl"
            />
            <button
              onClick={() => playlistSearch(form.playlistUrl)}
              disabled={status.loading}
              className="shrink-0 bg-[#E8622C] hover:bg-[#F2905A] disabled:opacity-60 text-[#0D0D0F] font-semibold py-3 px-7  cursor-pointer transition-colors duration-200 flex items-center justify-center gap-2"
            >
              Search
            </button>
            <button
              onClick={() => getOptimizedPlaylist(playlistInfo, playlistInfo.name)}
              disabled={status.loading}
              className="shrink-0 bg-[#E8622C] hover:bg-[#F2905A] disabled:opacity-60 text-[#0D0D0F] font-semibold py-3 px-7  cursor-pointer transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {status.loading ? (
                <AiOutlineLoading3Quarters className="size-4 animate-spin" />
              ) : (
                "Smoothify"
              )}
            </button>
          </div>
        </div>

        {/* Step rail + sliding card */}
        <div className="flex justify-center px-8 pt-16 pb-20">
          <div className="flex w-full max-w-3xl gap-10">
            {/* Vertical progress rail — the signature element: a fader strip */}
            <div className="flex flex-col items-center pt-2 shrink-0 justify-between">
              {STEPS.map((step, i) => (
                <div key={step.number} className="flex flex-col items-center gap-4">
                  <div className="flex flex-col items-center gap-3">
                    <motion.div
                      animate={{
                        backgroundColor: i <= activeIndex ? "#E8622C" : "rgba(255,255,255,0.08)",
                        color: i <= activeIndex ? "#0D0D0F" : "rgba(245,241,232,0.4)",
                        scale: i === activeIndex ? 1.12 : 1,
                      }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="text-sm font-medium w-9 h-9  flex items-center justify-center"
                    >
                      {step.number}
                    </motion.div>
                    {/* <p
                      className={`text-sm tracking-widest uppercase w-16 text-center leading-tight transition-colors duration-300 ${
                        i <= activeIndex ? "text-[#F2905A]" : "text-[#F5F1E8]/30"
                      }`}
                    >
                      {step.label}
                    </p> */}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="relative w-px h-16 bg-white/10 my-3 overflow-hidden">
                      <motion.div
                        initial={{ height: "0%" }}
                        animate={{ height: i < activeIndex ? "100%" : "0%" }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="absolute top-0 left-0 w-full bg-[#E8622C]"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Sliding card viewport */}
            <div className="relative flex-1 h-80 overflow-hidden border border-white/20 bg-white/[0.07]">
              <AnimatePresence mode="wait">
                {activeIndex === 0 && (
                  <motion.div
                    key="fetch"
                    initial={{ y: 60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -60, opacity: 0 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0"
                  >
                    <FetchCard loading={status.loading} playlistInfo={playlistInfo} />
                  </motion.div>
                )}

                {activeIndex === 1 && (
                  <motion.div
                    key="smoothify"
                    initial={{ y: 60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -60, opacity: 0 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0"
                  >
                    <SmoothifyCard status={status} />
                  </motion.div>
                )}

                {activeIndex === 2 && (
                  <motion.div
                    key="created"
                    initial={{ y: 60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -60, opacity: 0 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0"
                  >
                    <CreatedCard playlistInfo={playlistInfo} createdPlaylistId={createdPlaylistId} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FetchCard({ loading, playlistInfo }: { loading: boolean; playlistInfo: any }) {
  if (loading || !playlistInfo?.name) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-4 px-8">
        {/* <AiOutlineLoading3Quarters className="size-6 animate-spin text-[#E8622C]" /> */}

        <p className="text-sm tracking-widest text-[#F5F1E8]/40">
          {loading ? "Fetching your playlist" : "Waiting for a playlist link"}
        </p>
      </div>
    );
  }

  return (
    <div
      className="relative h-full w-full p-8 flex flex-col justify-end"
      style={{
        backgroundImage: `linear-gradient(0deg, rgba(13,13,15,0.9), rgba(13,13,15,0.2)), url('${playlistInfo.coverImage}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="flex justify-between items-end">
        <div>
          <h3 className="font-['Space_Grotesk'] font-bold text-3xl">{playlistInfo.name}</h3>
          {playlistInfo.owner && (
            <p className="text-[#F5F1E8]/60 mt-1">{playlistInfo.owner}</p>
          )}
        </div>
        {playlistInfo.url && (
          <a
            href={playlistInfo.url}
            target="_blank"
            rel="noreferrer"
            className=" bg-[#F5F1E8] text-[#0D0D0F] py-2 px-4 text-xs font-medium shrink-0"
          >
            Open in Spotify
          </a>
        )}
      </div>
    </div>
  );
}

function SmoothifyCard({ status }: { status: StatusState }) {
  const phases = [
    { key: "downloadComplete", label: "Download songs" },
    { key: "analyzingComplete", label: "Analyse" },
    { key: "comparingComplete", label: "Compare" },
    { key: "optimizingComplete", label: "Optimize" },
  ] as const;

  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-4">
      {phases.map((phase, i) => {
        const done = status[phase.key];
        return (
          <motion.div
            key={phase.key}
            initial={{ opacity: 0.3, x: -8 }}
            animate={{ opacity: done ? 1 : 0.35, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="flex items-center gap-3 w-48"
          >
            <motion.span
              animate={{ scale: done ? 1 : 0.85, color: done ? "#E8622C" : "white" }}
              transition={{ duration: 0.3 }}
            >
              <FaCheckCircle />
            </motion.span>
            <p className={`text-lg ${done ? "text-[#F5F1E8]" : "text-white"}`}>
              {phase.label}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}

function CreatedCard({
  playlistInfo,
  createdPlaylistId,
}: {
  playlistInfo: any;
  createdPlaylistId: string;
}) {
  return (
    <div
      className="relative h-full w-full p-8 flex flex-col justify-end"
      style={{
        backgroundImage: `linear-gradient(0deg, rgba(13,13,15,0.92), rgba(13,13,15,0.25)), url('${playlistInfo?.coverImage ?? ""}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="flex justify-between items-end"
      >
        <div>
          <p className="text-sm tracking-widest uppercase text-green-600">
            Ready
          </p>
          <h3 className="font-['Space_Grotesk'] font-bold text-3xl mt-1">
            {playlistInfo?.name ? `${playlistInfo.name} - Flow` : "Your new playlist"}
          </h3>
        </div>
        <a
          href={`https://open.spotify.com/playlist/${createdPlaylistId}`}
          target="_blank"
          rel="noreferrer"
          className=" bg-[#E8622C] text-[#0D0D0F] py-2 px-4 text-xs font-semibold shrink-0"
        >
          Go to playlist
        </a>
      </motion.div>
    </div>
  );
}

/** Headline where each letter bobs up and down in a traveling wave, cycling color from ember orange to green. */
function AnimatedHeadline({ text }: { text: string }) {
  return (
    <h2 className="font-['Space_Grotesk'] font-bold text-6xl md:text-7xl mt-6 leading-[1.05] flex flex-wrap justify-center">
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          className="inline-block"
          animate={{
            y: [0, -14, 0],
            color: ["#E8622C", "#4ADE80", "#E8622C"],
          }}
          transition={{
            y: { duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: i * 0.06 },
            color: { duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.06 },
          }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </h2>
  );
}

export default App;
