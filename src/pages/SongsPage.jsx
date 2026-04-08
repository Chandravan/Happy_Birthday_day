import { useEffect, useMemo, useRef, useState } from "react";

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const totalSeconds = Math.floor(seconds);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function SongsPage({ tracks = [], profile }) {
  const validTracks = useMemo(
    () => tracks.filter((track) => Boolean(track?.src)),
    [tracks]
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioError, setAudioError] = useState("");

  const audioRef = useRef(null);
  const activeIndexRef = useRef(0);
  const trackCountRef = useRef(0);
  const shouldResumeRef = useRef(false);

  const activeTrack = validTracks[activeIndex] || null;
  const progressPct =
    duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const playByIndex = async (index) => {
    if (!validTracks.length) return;
    const safeIndex = Math.max(0, Math.min(index, validTracks.length - 1));
    const isCurrentTrack = safeIndex === activeIndexRef.current;

    shouldResumeRef.current = true;
    setActiveIndex(safeIndex);
    activeIndexRef.current = safeIndex;

    const audio = audioRef.current;
    if (!audio) return;

    if (!isCurrentTrack) return;

    setIsLoading(true);
    setAudioError("");

    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
      setAudioError("Play blocked hua. Song card pe dobara tap karo.");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || !activeTrack) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      shouldResumeRef.current = false;
      return;
    }

    setIsLoading(true);
    setAudioError("");

    try {
      await audio.play();
      setIsPlaying(true);
      shouldResumeRef.current = true;
    } catch {
      setIsPlaying(false);
      setAudioError("Play blocked hua. Browser interaction ke baad dobara try karo.");
    } finally {
      setIsLoading(false);
    }
  };

  const playNext = async () => {
    if (!validTracks.length) return;
    const nextIndex = (activeIndex + 1) % validTracks.length;
    await playByIndex(nextIndex);
  };

  const playPrevious = async () => {
    if (!validTracks.length) return;
    const prevIndex = (activeIndex - 1 + validTracks.length) % validTracks.length;
    await playByIndex(prevIndex);
  };

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    trackCountRef.current = validTracks.length;
  }, [validTracks.length]);

  useEffect(() => {
    const audio = new Audio();
    audio.loop = false;
    audio.volume = 0.52;
    audio.preload = "metadata";

    const onPlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
      setAudioError("");
    };

    const onPause = () => {
      setIsPlaying(false);
      setIsLoading(false);
    };

    const onTimeUpdate = () => setCurrentTime(audio.currentTime || 0);
    const onLoadedMeta = () => setDuration(audio.duration || 0);
    const onWaiting = () => setIsLoading(true);
    const onPlaying = () => setIsLoading(false);
    const onEnded = () => {
      const count = trackCountRef.current;
      if (!count) return;
      shouldResumeRef.current = true;
      setActiveIndex((prev) => (prev + 1) % count);
    };
    const onError = () => {
      setIsPlaying(false);
      setIsLoading(false);
      setAudioError("Track load nahi ho paya. URL check karo.");
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMeta);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.currentTime = 0;
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMeta);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (activeIndex >= validTracks.length) {
      setActiveIndex(0);
      return;
    }

    const audio = audioRef.current;
    const src = activeTrack?.src;

    if (!audio || !src) {
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
      return;
    }

    const wasPlaying = shouldResumeRef.current;
    audio.src = src;
    audio.currentTime = 0;
    audio.load();
    setCurrentTime(0);
    setDuration(0);

    if (wasPlaying) {
      setIsLoading(true);
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          setIsPlaying(false);
          setIsLoading(false);
          setAudioError("Track switch ke baad play nahi hua. Play button dabao.");
        });
    }
  }, [activeIndex, activeTrack?.src, validTracks.length]);

  if (!validTracks.length) {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
        <div className="countdown-lock-card relative overflow-hidden rounded-[1.6rem] p-5 sm:rounded-[2rem] sm:p-10">
          <p className="tracking-love text-xs uppercase text-[#93452a]">Song Room</p>
          <h2 className="font-script mt-4 text-5xl leading-[0.9] text-[#672415] sm:text-7xl">
            No Songs Yet
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#6d3d30] sm:text-base">
            Admin panel se songs add karte hi yahan playlist auto show ho jayegi.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-8 sm:py-10">
      <div className="countdown-lock-card relative overflow-hidden rounded-[1.7rem] p-5 sm:rounded-[2.1rem] sm:p-10">
        <header>
          <p className="tracking-love text-xs uppercase text-[#93452a]">Dedicated Song Room</p>
          <h2 className="font-script mt-3 text-5xl leading-[0.9] text-[#672415] sm:text-7xl">
            Our Playlist
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#6d3d30] sm:text-base">
            {profile?.partnerName || "Your partner"} ke liye selected tracks, ek dedicated page me.
          </p>
        </header>

        <div className="mt-6 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-[1.5rem] border border-[#efc9b8] bg-[#fff6f0] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#9c5136]">Now Playing</p>
              <span className="rounded-full border border-[#eabca7] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8d4129]">
                {activeIndex + 1}/{validTracks.length}
              </span>
            </div>

            <div className="mt-5 flex items-center gap-4">
              <div className="relative h-20 w-20 shrink-0 rounded-full border border-[#e6b6a0] bg-gradient-to-br from-[#ffd4bd] via-[#ffbda1] to-[#d66546]">
                <div className="absolute inset-3 rounded-full border border-white/70 bg-[#fff3ea]" />
                <div className="absolute inset-[42%] rounded-full bg-[#9a4328]" />
              </div>

              <div className="min-w-0">
                <h3 className="truncate text-xl font-semibold text-[#632718]">{activeTrack?.title}</h3>
                <p className="mt-1 text-sm text-[#7d4a39]">{activeTrack?.artist || "Romantic Collection"}</p>
              </div>
            </div>

            <div className="mt-5">
              <div className="h-2 overflow-hidden rounded-full bg-[#f8d8c8]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#bc4a2b] via-[#d86d4c] to-[#f0a483]"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.12em] text-[#9c5338]">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void playPrevious()}
                className="rounded-full border border-[#d1896c] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8b3d24] transition hover:bg-[#ffe8dc]"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => void togglePlay()}
                className="rounded-full bg-[#ba4d2d] px-6 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#a64326]"
              >
                {isLoading ? "Loading..." : isPlaying ? "Pause" : "Play"}
              </button>
              <button
                type="button"
                onClick={() => void playNext()}
                className="rounded-full border border-[#d1896c] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8b3d24] transition hover:bg-[#ffe8dc]"
              >
                Next
              </button>
            </div>

            {audioError && (
              <p className="mt-3 rounded-xl border border-[#da7e5f] bg-[#fff2ea] px-3 py-2 text-sm text-[#8f351e]">
                {audioError}
              </p>
            )}
          </article>

          <article className="rounded-[1.5rem] border border-[#efc9b8] bg-[#fff8f3] p-5 sm:p-6">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#9c5136]">Playlist Queue</p>
            <div className="mt-4 space-y-2">
              {validTracks.map((track, index) => (
                <button
                  key={track.id || `${track.title}-${index}`}
                  type="button"
                  onClick={() => void playByIndex(index)}
                  className={[
                    "w-full rounded-xl border px-4 py-3 text-left transition",
                    index === activeIndex
                      ? "border-[#cf5f3a] bg-[#ffe1d3]"
                      : "border-[#edd1c5] bg-white hover:bg-[#fff1e8]",
                  ].join(" ")}
                >
                  <p className="truncate text-sm font-semibold text-[#6f2d1d]">{track.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.1em] text-[#9b573d]">
                    {track.artist || "Romantic Collection"}
                  </p>
                </button>
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
