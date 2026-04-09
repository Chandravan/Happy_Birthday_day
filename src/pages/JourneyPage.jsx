import { useEffect, useMemo, useRef, useState } from "react";
import { coupleProfile, journeyChapterMusic } from "../data/journeyData";

const chapterThemes = [
  "from-[#fffaf6] via-[#fff2eb] to-[#ffe6db] border-[#efcdbf]",
  "from-[#fffefb] via-[#fff4ea] to-[#ffece0] border-[#f0d6c4]",
  "from-[#fff8f3] via-[#ffece2] to-[#ffe0d2] border-[#e9c0ad]",
];

const memoryDetails = [
  "First smile that felt like home.",
  "Conversations that made time disappear.",
  "Little dates, big feelings.",
  "When love felt safe and steady.",
  "We held on even on tough days.",
  "Still choosing each other, every day.",
];

export const heartNotes = [
  // Chapter 01 – Beginning
  "That first day, I didn’t know you’d become my whole story.",

  // Chapter 02 – Silence & Ego
  "Even in silence, my heart somehow stayed around you.",

  // Chapter 03 – Her Heartbreak (you not involved)
  "I wasn’t there… but somewhere, your pain still reached my heart.",

  // Chapter 04 – Healing Phase
  "While you were healing, I was just a stranger… waiting without knowing.",

  // Chapter 05 – Talks Begin
  "Somewhere between random talks, you started feeling like home.",

  // Chapter 06 – Besties → Partners
  "That day, friendship quietly turned into everything my heart wanted.",

  // Chapter 07 – Couple Days
  "Loving you daily became the simplest and happiest part of my life.",

  // Chapter 08 – Temple & Travel
  "Every journey with you felt like a blessing written just for us.",

  // Chapter 09 – Movie Date
  "Even the smallest moments with you felt like scenes from a dream.",

  // Chapter 10 – Hard Truth
  "Truth wasn’t easy, but choosing you was always worth it.",

  // Chapter 11 – Trip
  "With you, even a few days felt like memories for a lifetime.",

  // Chapter 12 – Birthday Finale
  "It was your special day… but somehow, you became my greatest gift.",
];

function ChapterControls({
  moments,
  unlockedCount,
  activeIndex,
  progress,
  onSelect,
  onUnlock,
  unlocking,
}) {
  const hasNext = unlockedCount < moments.length;
  const nextMoment = hasNext ? moments[unlockedCount] : null;
  const currentMoment = moments[Math.min(activeIndex, unlockedCount - 1)];

  return (
    <section className="journey-control-ribbon rounded-[1.3rem] p-4 sm:rounded-[1.5rem] sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#a15437]">
            Current Moment
          </p>
          <p className="mt-1 text-base font-semibold text-[#6f2e1e] sm:text-xl">
            {currentMoment?.chapter} - {currentMoment?.title}
          </p>
          <p className="text-xs text-[#8b5846]">
            {currentMoment?.date} | {currentMoment?.place}
          </p>
        </div>

        <div className="w-full max-w-sm">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-[#9e4d31]">
            <span>Unlocked</span>
            <span>
              {unlockedCount}/{moments.length}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#f8d8c8]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#bf3f22] via-[#da6e4c] to-[#eea082]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {hasNext ? (
          <button
            type="button"
            onClick={onUnlock}
            disabled={unlocking}
            className="unlock-love-btn w-full rounded-full px-5 py-3 text-sm font-semibold sm:w-auto"
          >
            {unlocking
              ? "Unlocking the next chapter..."
              : "Tap to unlock next chapter"}
          </button>
        ) : (
          <div className="rounded-full bg-[#ffe5d8] px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#8f3f26] ring-1 ring-[#efc6b4]">
            Full Journey Unlocked
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {moments.map((moment, idx) => {
          const locked = idx >= unlockedCount;
          return (
            <button
              key={`${moment.chapter}-${moment.title}`}
              type="button"
              onClick={() => onSelect(idx)}
              disabled={locked}
              className={[
                "shrink-0 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.17em] transition",
                locked
                  ? "cursor-not-allowed border-[#efd5ca] bg-[#fff7f2] text-[#b97b66]"
                  : "border-[#edc2af] bg-[#fff2ea] text-[#8d4129] hover:bg-[#ffe8dc]",
                idx === activeIndex && !locked
                  ? "border-[#cf5e39] bg-[#ffdccc] text-[#7a2d1a]"
                  : "",
              ].join(" ")}
            >
              {moment.chapter}
            </button>
          );
        })}
      </div>

      {hasNext && (
        <p className="mt-3 text-xs font-medium text-[#99563f]">
          Next chapter: {nextMoment?.chapter} - {nextMoment?.title}
        </p>
      )}
    </section>
  );
}

function MemoryCard({
  moment,
  index,
  active,
  locked,
  nextLocked,
  visible,
  onUnlock,
  unlocking,
}) {
  const theme = chapterThemes[index % chapterThemes.length];
  const detail = memoryDetails[index % memoryDetails.length];
  const note = heartNotes[index % heartNotes.length];

  return (
    <article
      className={[
        "romance-memory-card relative overflow-hidden rounded-[1.7rem] border bg-gradient-to-br p-5 sm:p-7",
        theme,
        active ? "is-active" : "",
        locked ? "is-locked" : "",
        unlocking ? "is-unlocking" : "",
        visible ? "is-visible" : "",
      ].join(" ")}
    >
      <span className="memory-tape left" />
      <span className="memory-tape right" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.26em] text-[#9d5034]">
          {moment.chapter}
        </p>
        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#7f3a24]">
          {detail}
        </span>
      </div>

      <h3 className="mt-3 font-display text-2xl leading-tight text-[#5f2113] sm:text-4xl">
        {moment.title}
      </h3>

      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#934b2f]">
        {moment.date} | {moment.place}
      </p>

      <p className="font-script mt-5 text-3xl leading-[1.06] text-[#9d4b33] sm:text-5xl">
        "{note}"
      </p>

      <p className="mt-4 rounded-2xl bg-white/62 px-4 py-4 text-sm leading-relaxed text-[#6d3f31]">
        {moment.note}
      </p>

      <div className="love-chip-strip mt-5 flex flex-wrap gap-2 rounded-xl px-3 py-3">
        <span className="love-chip">Forever Memory</span>
      </div>

      {locked && (
        <div className="memory-lock-overlay rounded-[1.45rem]">
          <p className="memory-lock-pill">Sealed Chapter</p>
          <p className="memory-lock-text">
            {nextLocked
              ? "Yeh chapter ready hai. Tap karo aur next memory reveal karo."
              : "Previous chapter unlock hone ke baad hi yeh scene khulega."}
          </p>
          {nextLocked && (
            <button
              type="button"
              onClick={onUnlock}
              disabled={unlocking}
              className="unlock-overlay-btn rounded-full px-4 py-2 text-sm font-semibold"
            >
              {unlocking ? "Unlocking..." : "Tap to unlock next chapter"}
            </button>
          )}
        </div>
      )}
    </article>
  );
}

export default function JourneyPage({ moments, tracks = journeyChapterMusic }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [unlockedCount, setUnlockedCount] = useState(1);
  const [unlockingIndex, setUnlockingIndex] = useState(null);
  const [transitionPulse, setTransitionPulse] = useState(false);
  const [visibleIndices, setVisibleIndices] = useState([0]);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicLoading, setMusicLoading] = useState(false);
  const [musicError, setMusicError] = useState("");
  const cardRefs = useRef([]);
  const unlockTimerRef = useRef(null);
  const pulseTimerRef = useRef(null);
  const audioRef = useRef(null);
  const activeTrackRef = useRef("");

  const safeTrackIndex =
    tracks.length > 0 ? Math.min(activeIndex, tracks.length - 1) : -1;

  const activeTrack = safeTrackIndex >= 0 ? tracks[safeTrackIndex] : null;

  const floatingHearts = useMemo(
    () =>
      Array.from({ length: 20 }, (_, idx) => ({
        id: idx,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 7}s`,
        duration: `${9 + Math.random() * 9}s`,
        size: `${10 + Math.random() * 11}px`,
      })),
    [],
  );

  useEffect(() => {
    return () => {
      if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current);
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const audio = new Audio();
    const firstTrack = tracks[0];
    if (firstTrack?.src) {
      audio.src = firstTrack.src;
      activeTrackRef.current = firstTrack.src;
    }
    audio.loop = true;
    audio.volume = 0.42;
    audio.preload = "metadata";

    const handlePlay = () => {
      setIsMusicPlaying(true);
      setMusicLoading(false);
      setMusicError("");
    };

    const handlePause = () => {
      setIsMusicPlaying(false);
      setMusicLoading(false);
    };

    const handleError = () => {
      setIsMusicPlaying(false);
      setMusicLoading(false);
      setMusicError("Music load nahi hui. Track URL check/update kar lo.");
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("error", handleError);

    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.currentTime = 0;
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("error", handleError);
      audioRef.current = null;
    };
  }, [tracks]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !activeTrack?.src) return;
    if (activeTrackRef.current === activeTrack.src) return;

    const shouldResume = isMusicPlaying && !audio.paused;
    activeTrackRef.current = activeTrack.src;
    audio.src = activeTrack.src;
    audio.currentTime = 0;
    audio.load();

    if (shouldResume) {
      setMusicLoading(true);
      audio.play().catch(() => {
        setMusicLoading(false);
        setIsMusicPlaying(false);
        setMusicError("Chapter music play nahi ho payi. Dobara tap karo.");
      });
    }
  }, [activeTrack?.src, isMusicPlaying]);

  useEffect(() => {
    const cards = cardRefs.current.filter(Boolean);
    if (!cards.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => {
            const idx = Number(entry.target.getAttribute("data-scene-idx"));
            return entry.isIntersecting && idx < unlockedCount;
          })
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (!visible.length) return;
        const idx = Number(visible[0].target.getAttribute("data-scene-idx"));
        if (!Number.isNaN(idx)) {
          setActiveIndex(idx);
          setVisibleIndices((prev) =>
            prev.includes(idx) ? prev : [...prev, idx],
          );
        }
      },
      {
        threshold: [0.3, 0.5, 0.72],
        rootMargin: "-20% 0px -32% 0px",
      },
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [moments.length, unlockedCount]);

  const jumpToScene = (idx) => {
    if (idx >= unlockedCount) return;
    const target = cardRefs.current[idx];
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    setActiveIndex(idx);
    setVisibleIndices((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
  };

  const unlockNextChapter = () => {
    if (unlockedCount >= moments.length || unlockingIndex !== null) return;
    const nextIdx = unlockedCount;

    void playTrackAtIndex(activeIndex);

    setUnlockingIndex(nextIdx);
    setTransitionPulse(true);

    if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current);
    if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);

    unlockTimerRef.current = setTimeout(() => {
      setUnlockedCount((prev) => Math.min(prev + 1, moments.length));
      setActiveIndex(nextIdx);
      setVisibleIndices((prev) =>
        prev.includes(nextIdx) ? prev : [...prev, nextIdx],
      );
      setUnlockingIndex(null);
      const target = cardRefs.current[nextIdx];
      if (target)
        target.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 840);

    pulseTimerRef.current = setTimeout(() => {
      setTransitionPulse(false);
    }, 1180);
  };

  const progress =
    moments.length <= 1 ? 100 : (unlockedCount / moments.length) * 100;

  const activeMoment = moments[Math.min(activeIndex, unlockedCount - 1)];
  const hasNextChapter = unlockedCount < moments.length;
  const nextMoment = hasNextChapter ? moments[unlockedCount] : null;

  const getTrackByIndex = (index) => {
    if (!tracks.length) return null;
    const safeIndex = Math.min(Math.max(index, 0), tracks.length - 1);
    return tracks[safeIndex];
  };

  const playTrackAtIndex = async (index) => {
    const audio = audioRef.current;
    const track = getTrackByIndex(index);
    if (!audio) return;
    if (!track?.src) {
      setMusicError("Music track configured nahi hai.");
      return;
    }

    if (activeTrackRef.current !== track.src) {
      activeTrackRef.current = track.src;
      audio.src = track.src;
      audio.currentTime = 0;
      audio.load();
    }

    if (!audio.paused) {
      setIsMusicPlaying(true);
      setMusicLoading(false);
      setMusicError("");
      return;
    }

    setMusicLoading(true);
    setMusicError("");

    try {
      await audio.play();
    } catch {
      setMusicLoading(false);
      setMusicError(
        "Play blocked hua. Dobara tap karo ya track URL replace karo.",
      );
    }
  };

  const toggleJourneyMusic = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMusicPlaying) {
      audio.pause();
      return;
    }
    await playTrackAtIndex(activeIndex);
  };

  return (
    <section className="relative mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-8 sm:py-10">
      <div className="journey-love-stage relative overflow-hidden rounded-[1.7rem] p-4 sm:rounded-[2.1rem] sm:p-10">
        <div
          className={[
            "journey-unlock-flash",
            transitionPulse ? "is-active" : "",
          ].join(" ")}
          aria-hidden="true"
        />

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {floatingHearts.map((heart) => (
            <span
              key={heart.id}
              className="love-float-heart"
              style={{
                left: heart.left,
                animationDelay: heart.delay,
                animationDuration: heart.duration,
                width: heart.size,
                height: heart.size,
              }}
            />
          ))}
        </div>

        <header className="moon-romance-hero relative z-10 rounded-[1.4rem] p-5 sm:rounded-[1.8rem] sm:p-8">
          <div className="moon-badge-wrap">
            <span className="moon-badge-ring" />
            <span className="moon-badge-core" />
          </div>

          <p className="tracking-love text-xs uppercase text-[#9c4a2f]">
            Our Forever Diary
          </p>
          <h2 className="font-script mt-3 text-5xl leading-[0.9] text-[#652616] sm:text-7xl md:text-8xl">
            {coupleProfile.yourName}
            <span className="mx-2 inline-block animate-heartbeat text-[#cf4f2d]">
              {"\u2665"}
            </span>
            {coupleProfile.partnerName}
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#6f3e31] sm:text-base"></p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={toggleJourneyMusic}
              className={[
                "journey-music-toggle inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.17em]",
                isMusicPlaying ? "is-playing" : "",
              ].join(" ")}
            >
              {musicLoading
                ? "Loading..."
                : isMusicPlaying
                  ? "Pause Music"
                  : "Tap to Play Music"}
            </button>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#9f563b]">
              {activeTrack
                ? `${activeTrack.title} • ${activeMoment?.chapter}`
                : "No Track"}
            </p>
            <span
              className={[
                "journey-music-wave",
                isMusicPlaying ? "is-playing" : "",
              ].join(" ")}
              aria-hidden="true"
            >
              <span />
              <span />
              <span />
              <span />
            </span>
          </div>

          {musicError && (
            <p className="mt-2 text-xs font-semibold text-[#9a4024]">
              {musicError}
            </p>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <article className="rounded-2xl bg-white/72 px-4 py-4 ring-1 ring-white/80">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#a25438]">
                Total Chapters
              </p>
              <p className="mt-1 text-2xl font-semibold text-[#6f2d1d]">
                {moments.length}
              </p>
            </article>
            <article className="rounded-2xl bg-white/72 px-4 py-4 ring-1 ring-white/80">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#a25438]">
                Unlocked
              </p>
              <p className="mt-1 text-2xl font-semibold text-[#6f2d1d]">
                {unlockedCount}
              </p>
            </article>
            <article className="rounded-2xl bg-white/72 px-4 py-4 ring-1 ring-white/80">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#a25438]">
                Live Scene
              </p>
              <p className="mt-1 text-base font-semibold text-[#6f2d1d]">
                {activeMoment?.title}
              </p>
            </article>
          </div>
        </header>

        <div className="relative z-10 mt-8">
          <ChapterControls
            moments={moments}
            unlockedCount={unlockedCount}
            activeIndex={activeIndex}
            onSelect={jumpToScene}
            onUnlock={unlockNextChapter}
            unlocking={unlockingIndex !== null}
            progress={progress}
          />

          <div className="relative mt-6 space-y-8">
            <div className="journey-thread-line" />
            {moments.map((moment, idx) => {
              const isLocked = idx >= unlockedCount;
              const isNextLocked = idx === unlockedCount;
              const isUnlocking = unlockingIndex === idx;
              const isVisible = visibleIndices.includes(idx);

              return (
                <div
                  key={`${moment.chapter}-${moment.date}`}
                  ref={(el) => {
                    cardRefs.current[idx] = el;
                  }}
                  data-scene-idx={idx}
                  className={[
                    "relative pl-10 transition-transform duration-300 sm:pl-14",
                    idx === activeIndex && !isLocked ? "translate-x-0.5" : "",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "scene-bloom-index absolute left-0 top-6 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border text-[11px] font-semibold sm:h-10 sm:w-10 sm:text-xs",
                      isLocked
                        ? "border-[#edcfc2] bg-[#fff8f3] text-[#b1715b]"
                        : "border-[#f5c8b5] bg-[#fff4ee] text-[#8d3d25]",
                    ].join(" ")}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </span>

                  <MemoryCard
                    moment={moment}
                    index={idx}
                    active={idx === activeIndex && !isLocked}
                    locked={isLocked}
                    nextLocked={isNextLocked}
                    visible={isVisible}
                    onUnlock={unlockNextChapter}
                    unlocking={isUnlocking}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {hasNextChapter && (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 px-4 sm:bottom-6 sm:px-8">
          <div className="mx-auto flex w-full max-w-7xl justify-center">
            <button
              type="button"
              onClick={unlockNextChapter}
              disabled={unlockingIndex !== null}
              className="journey-float-unlock pointer-events-auto w-full max-w-md rounded-full px-5 py-3 text-sm font-semibold text-white"
            >
              {unlockingIndex !== null
                ? "Unlocking the next chapter..."
                : `Tap to unlock ${nextMoment?.chapter ?? "next chapter"}`}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
