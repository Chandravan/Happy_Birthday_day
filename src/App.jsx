import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Link, NavLink, Route, Routes } from "react-router-dom";
import {
  birthdayUnlock,
  coupleProfile,
  futurePlans,
  futurePromises,
  loveReasons,
  memoryFrames,
  timelineMoments,
} from "./data/journeyData";
import FuturePage from "./pages/FuturePage";
import HomePage from "./pages/HomePage";
import JourneyPage from "./pages/JourneyPage";
import MemoriesPage from "./pages/MemoriesPage";
import ReasonsPage from "./pages/ReasonsPage";
import StarMapPage from "./pages/StarMapPage";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Journey", to: "/journey" },
  { label: "Star Map", to: "/starmap" },
  { label: "Reasons", to: "/reasons" },
  { label: "Memories", to: "/memories" },
  { label: "Future", to: "/future" },
];

function formatRemaining(msLeft) {
  const total = Math.max(0, msLeft);
  const totalSeconds = Math.floor(total / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { total, days, hours, minutes, seconds };
}

function FloatingOrbs() {
  const orbs = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 6}s`,
        duration: `${8 + Math.random() * 7}s`,
        size: `${10 + Math.random() * 10}px`,
      })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {orbs.map((orb) => (
        <span
          key={orb.id}
          className="float-orb"
          style={{
            left: orb.left,
            animationDelay: orb.delay,
            animationDuration: orb.duration,
            width: orb.size,
            height: orb.size,
          }}
        />
      ))}
    </div>
  );
}

function Header({ isUnlocked, remaining }) {
  return (
    <header className="romance-nav-shell sticky top-0 z-30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-4">
        <div className="min-w-0">
          <p className="tracking-love text-xs uppercase text-[#98482d]">
            Birthday Surprise
          </p>
          <h1 className="font-display mt-1 text-[1.6rem] leading-none text-[#6f2a19] sm:mt-0 sm:text-3xl">
            {coupleProfile.yourName} x {coupleProfile.partnerName}
          </h1>
        </div>

        {!isUnlocked && (
          <p className="countdown-chip w-fit rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] sm:px-4 sm:text-xs">
            Unlocks in {remaining.days}d {String(remaining.hours).padStart(2, "0")}
            h {String(remaining.minutes).padStart(2, "0")}m{" "}
            {String(remaining.seconds).padStart(2, "0")}s
          </p>
        )}

        <nav className="nav-scroll-row -mx-1 flex w-full gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:w-auto sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
          {navLinks.map((link) => {
            const locked = !isUnlocked && link.to !== "/";
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) =>
                  [
                    "romance-nav-link shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm",
                    isActive ? "is-active" : "",
                    locked ? "is-locked" : "",
                  ].join(" ")
                }
              >
                {locked ? `${link.label} (Locked)` : link.label}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

function LockedRoutePage({ remaining }) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      <div className="countdown-lock-card relative overflow-hidden rounded-[1.6rem] p-5 sm:rounded-[2rem] sm:p-10">
        <p className="tracking-love text-xs uppercase text-[#93452a]">
          Romantic Countdown
        </p>
        <h2 className="font-script mt-4 text-5xl leading-[0.9] text-[#672415] sm:text-7xl">
          Almost There
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#6d3d30] sm:text-base">
          Ye pages birthday midnight pe unlock honge. Tab tak home pe teaser
          experience live hai.
        </p>
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#9a4d33]">
          Unlock Time: {birthdayUnlock.displayText}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <article className="countdown-unit rounded-xl p-4 text-center">
            <p className="text-2xl font-semibold text-[#6f2d1d] sm:text-3xl">
              {remaining.days}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-[#9d5237]">
              Days
            </p>
          </article>
          <article className="countdown-unit rounded-xl p-4 text-center">
            <p className="text-2xl font-semibold text-[#6f2d1d] sm:text-3xl">
              {String(remaining.hours).padStart(2, "0")}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-[#9d5237]">
              Hours
            </p>
          </article>
          <article className="countdown-unit rounded-xl p-4 text-center">
            <p className="text-2xl font-semibold text-[#6f2d1d] sm:text-3xl">
              {String(remaining.minutes).padStart(2, "0")}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-[#9d5237]">
              Minutes
            </p>
          </article>
          <article className="countdown-unit rounded-xl p-4 text-center">
            <p className="text-2xl font-semibold text-[#6f2d1d] sm:text-3xl">
              {String(remaining.seconds).padStart(2, "0")}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-[#9d5237]">
              Seconds
            </p>
          </article>
        </div>

        <div className="mt-6">
          <Link
            to="/"
            className="unlock-love-btn inline-flex rounded-full px-6 py-3 text-sm font-semibold text-white"
          >
            Back To Home Teaser
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const unlockTimestamp = new Date(birthdayUnlock.unlockAt).getTime();
  const [now, setNow] = useState(() => Date.now());

  const previewOverride = useMemo(() => {
    if (typeof window === "undefined") return false;
    const search = new URLSearchParams(window.location.search);
    const previewFlag = search.get("preview");
    const localHost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    return localHost || previewFlag === "1" || previewFlag === "true";
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = formatRemaining(unlockTimestamp - now);
  const isUnlocked = now >= unlockTimestamp || previewOverride;

  return (
    <BrowserRouter>
      <main className="story-bg relative min-h-screen overflow-hidden font-body text-[#4a1f14]">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#ff9d84]/35 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-[#ffd5b8]/45 blur-3xl" />
        <FloatingOrbs />
        <Header isUnlocked={isUnlocked} remaining={remaining} />

        {previewOverride && now < unlockTimestamp && (
          <div className="relative z-20 mx-auto w-full max-w-6xl px-4 pt-3 sm:px-8">
            <p className="countdown-chip inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em]">
              Preview Mode Active
            </p>
          </div>
        )}

        <div className="relative z-10">
          <Routes>
            <Route
              path="/"
              element={<HomePage profile={coupleProfile} />}
            />
            <Route
              path="/journey"
              element={
                isUnlocked ? (
                  <JourneyPage moments={timelineMoments} />
                ) : (
                  <LockedRoutePage remaining={remaining} />
                )
              }
            />
            <Route
              path="/reasons"
              element={
                isUnlocked ? (
                  <ReasonsPage reasons={loveReasons} profile={coupleProfile} />
                ) : (
                  <LockedRoutePage remaining={remaining} />
                )
              }
            />
            <Route
              path="/starmap"
              element={
                isUnlocked ? (
                  <StarMapPage />
                ) : (
                  <LockedRoutePage remaining={remaining} />
                )
              }
            />
            <Route
              path="/memories"
              element={
                isUnlocked ? (
                  <MemoriesPage frames={memoryFrames} />
                ) : (
                  <LockedRoutePage remaining={remaining} />
                )
              }
            />
            <Route
              path="/future"
              element={
                isUnlocked ? (
                  <FuturePage plans={futurePlans} promises={futurePromises} />
                ) : (
                  <LockedRoutePage remaining={remaining} />
                )
              }
            />
          </Routes>
        </div>
      </main>
    </BrowserRouter>
  );
}
