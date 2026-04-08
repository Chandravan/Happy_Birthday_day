import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Link, NavLink, Route, Routes } from "react-router-dom";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import {
  birthdayUnlock,
  coupleProfile,
  futurePlans,
  futurePromises,
  journeyChapterMusic,
  loveReasons,
  memoryFrames,
  timelineMoments,
} from "./data/journeyData";
import AdminPanelPage from "./pages/AdminPanelPage";
import FuturePage from "./pages/FuturePage";
import HomePage from "./pages/HomePage";
import JourneyPage from "./pages/JourneyPage";
import MemoriesPage from "./pages/MemoriesPage";
import ReasonsPage from "./pages/ReasonsPage";
import { auth, db, isFirebaseConfigured } from "./lib/firebase";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Journey", to: "/journey" },
  { label: "Reasons", to: "/reasons" },
  { label: "Memories", to: "/memories" },
  { label: "Future", to: "/future" },
  { label: "Admin", to: "/admin" },
];

function getAuthErrorMessage(error) {
  const code = error?.code || "";

  if (code === "auth/configuration-not-found") {
    return "Firebase Console me Authentication > Sign-in method jaake Google provider enable karo, support email select karke Save karo.";
  }

  if (code === "auth/unauthorized-domain") {
    return "Current domain authorized nahi hai. Firebase Console > Authentication > Settings > Authorized domains me is domain ko add karo.";
  }

  if (code === "auth/popup-blocked") {
    return "Browser ne popup block kar diya. Popup allow karke dobara Login with Google try karo.";
  }

  if (code === "auth/popup-closed-by-user") {
    return "Google popup close ho gaya. Please dobara login try karo.";
  }

  if (code === "auth/network-request-failed") {
    return "Network issue aa gaya. Internet check karke dobara try karo.";
  }

  return "Google login complete nahi hua. Please dobara try karo.";
}

function formatRemaining(msLeft) {
  const total = Math.max(0, msLeft);
  const totalSeconds = Math.floor(total / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { total, days, hours, minutes, seconds };
}

function toSortedSongList(snapshot) {
  const fallbackOrder = Number.MAX_SAFE_INTEGER;

  return snapshot.docs
    .map((docSnap) => {
      const data = docSnap.data() || {};
      const src = typeof data.src === "string" ? data.src.trim() : "";

      return {
        id: docSnap.id,
        title: data.title || "Untitled Song",
        src,
        artist: data.artist || "",
        order: Number.isFinite(Number(data.order))
          ? Number(data.order)
          : fallbackOrder,
        createdAt: data.createdAt?.toMillis?.() || 0,
      };
    })
    .filter((song) => Boolean(song.src))
    .sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.createdAt - b.createdAt;
    });
}

function toSortedPhotoList(snapshot) {
  const fallbackOrder = Number.MAX_SAFE_INTEGER;

  return snapshot.docs
    .map((docSnap) => {
      const data = docSnap.data() || {};

      return {
        id: docSnap.id,
        title: data.title || "Memory Frame",
        hint: data.hint || "Add your special photo here",
        vibe: data.vibe || "Pure us energy",
        imageUrl: data.imageUrl || "",
        caption: data.caption || "",
        order: Number.isFinite(Number(data.order))
          ? Number(data.order)
          : fallbackOrder,
        createdAt: data.createdAt?.toMillis?.() || 0,
      };
    })
    .sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.createdAt - b.createdAt;
    });
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
    [],
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

function Header({ isUnlocked, remaining, user, onLogout }) {
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
            Unlocks in {remaining.days}d{" "}
            {String(remaining.hours).padStart(2, "0")}h{" "}
            {String(remaining.minutes).padStart(2, "0")}m{" "}
            {String(remaining.seconds).padStart(2, "0")}s
          </p>
        )}

        <nav className="nav-scroll-row -mx-1 flex w-full gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:w-auto sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
          {navLinks.map((link) => {
            const locked =
              !isUnlocked && link.to !== "/" && link.to !== "/admin";
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

        {user && (
          <div className="flex w-full items-center justify-end sm:w-auto">
            <button
              type="button"
              onClick={onLogout}
              className="rounded-full border border-[#b8745d] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#7c341f] transition hover:bg-[#ffd9c8] sm:text-xs"
            >
              Logout
            </button>
          </div>
        )}
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

function AuthLoadingPage() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      <div className="countdown-lock-card relative overflow-hidden rounded-[1.6rem] p-5 sm:rounded-[2rem] sm:p-10">
        <p className="tracking-love text-xs uppercase text-[#93452a]">
          Authentication Check
        </p>
        <h2 className="font-script mt-4 text-5xl leading-[0.9] text-[#672415] sm:text-7xl">
          Hold On
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#6d3d30] sm:text-base">
          Google login status verify ho raha hai.
        </p>
      </div>
    </section>
  );
}

function AuthRequiredPage({ onLogin, isSigningIn, authError }) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      <div className="countdown-lock-card relative overflow-hidden rounded-[1.6rem] p-5 sm:rounded-[2rem] sm:p-10">
        <p className="tracking-love text-xs uppercase text-[#93452a]">
          Private Love Space
        </p>
        <h2 className="font-script mt-4 text-5xl leading-[0.9] text-[#672415] sm:text-7xl">
          Login Required
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#6d3d30] sm:text-base">
          Home page sabke liye open hai, lekin baaki pages dekhne ke liye Google
          se login zaroori hai.
        </p>

        {authError && (
          <p className="mt-4 rounded-xl border border-[#da7e5f] bg-[#fff2ea] px-4 py-3 text-sm text-[#8f351e]">
            {authError}
          </p>
        )}

        <div className="mt-6">
          <button
            type="button"
            onClick={onLogin}
            disabled={isSigningIn}
            className="unlock-love-btn inline-flex rounded-full px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-75"
          >
            {isSigningIn ? "Signing In..." : "Login with Google"}
          </button>
        </div>
      </div>
    </section>
  );
}

function FirebaseSetupPage() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      <div className="countdown-lock-card relative overflow-hidden rounded-[1.6rem] p-5 sm:rounded-[2rem] sm:p-10">
        <p className="tracking-love text-xs uppercase text-[#93452a]">
          Firebase Setup Needed
        </p>
        <h2 className="font-script mt-4 text-5xl leading-[0.9] text-[#672415] sm:text-7xl">
          Add .env Keys
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#6d3d30] sm:text-base">
          Firebase config missing hai. `.env.example` ke basis pe `.env` file me
          VITE_FIREBASE_* values add karo.
        </p>
      </div>
    </section>
  );
}

function AdminAccessDeniedPage() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      <div className="countdown-lock-card relative overflow-hidden rounded-[1.6rem] p-5 sm:rounded-[2rem] sm:p-10">
        <p className="tracking-love text-xs uppercase text-[#93452a]">
          Admin Access Required
        </p>
        <h2 className="font-script mt-4 text-5xl leading-[0.9] text-[#672415] sm:text-7xl">
          Access Denied
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#6d3d30] sm:text-base">
          Is page ko open karne ke liye admin account se login karna padega.
        </p>
      </div>
    </section>
  );
}

function ProtectedRoutePage({
  user,
  authLoading,
  isSigningIn,
  onLogin,
  authError,
  requireAdmin = false,
  isAdmin = false,
  children,
}) {
  if (!isFirebaseConfigured || !auth) {
    return <FirebaseSetupPage />;
  }

  if (authLoading) {
    return <AuthLoadingPage />;
  }

  if (!user) {
    return (
      <AuthRequiredPage
        onLogin={onLogin}
        isSigningIn={isSigningIn}
        authError={authError}
      />
    );
  }

  if (requireAdmin && !isAdmin) {
    return <AdminAccessDeniedPage />;
  }

  return children;
}

export default function App() {
  const unlockTimestamp = new Date(birthdayUnlock.unlockAt).getTime();
  const [now, setNow] = useState(() => Date.now());
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState("");
  const [songTracks, setSongTracks] = useState(journeyChapterMusic);
  const [photoFrames, setPhotoFrames] = useState(memoryFrames);

  const previewOverride = useMemo(() => {
    if (typeof window === "undefined") return false;
    const search = new URLSearchParams(window.location.search);
    const previewFlag = search.get("preview");
    const localHost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    return localHost || previewFlag === "1" || previewFlag === "true";
  }, []);

  const allowedAdminEmails = useMemo(() => {
    const rawEmails = import.meta.env.VITE_ADMIN_EMAILS || "";
    return rawEmails
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
  }, []);

  const isAdmin = useMemo(() => {
    if (!user) return false;
    if (!allowedAdminEmails.length) return true;
    return allowedAdminEmails.includes((user.email || "").toLowerCase());
  }, [allowedAdminEmails, user]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!auth || !isFirebaseConfigured) {
      setAuthLoading(false);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!db || !isFirebaseConfigured) {
      setSongTracks(journeyChapterMusic);
      setPhotoFrames(memoryFrames);
      return undefined;
    }

    const songsUnsubscribe = onSnapshot(
      collection(db, "songs"),
      (snapshot) => {
        const songs = toSortedSongList(snapshot);
        setSongTracks(songs.length > 0 ? songs : journeyChapterMusic);
      },
      () => setSongTracks(journeyChapterMusic),
    );

    const photosUnsubscribe = onSnapshot(
      collection(db, "photos"),
      (snapshot) => {
        const photos = toSortedPhotoList(snapshot);
        setPhotoFrames(photos.length > 0 ? photos : memoryFrames);
      },
      () => setPhotoFrames(memoryFrames),
    );

    return () => {
      songsUnsubscribe();
      photosUnsubscribe();
    };
  }, []);

  const handleGoogleLogin = async () => {
    if (!auth) return;

    setAuthError("");
    setIsSigningIn(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));

      if (import.meta.env.DEV) {
        console.error("Google sign-in error:", error);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogout = async () => {
    if (!auth) return;

    try {
      await signOut(auth);
      setAuthError("");
    } catch (error) {
      setAuthError(error?.message || "Logout nahi ho paya. Dobara try karo.");
    }
  };

  const remaining = formatRemaining(unlockTimestamp - now);
  const isUnlocked = now >= unlockTimestamp || previewOverride;

  return (
    <BrowserRouter>
      <main className="story-bg relative min-h-screen overflow-hidden font-body text-[#4a1f14]">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#ff9d84]/35 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-[#ffd5b8]/45 blur-3xl" />
        <FloatingOrbs />
        <Header
          isUnlocked={isUnlocked}
          remaining={remaining}
          user={user}
          onLogout={handleLogout}
        />

        {previewOverride && now < unlockTimestamp && (
          <div className="relative z-20 mx-auto w-full max-w-6xl px-4 pt-3 sm:px-8">
            <p className="countdown-chip inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em]">
              Preview Mode Active
            </p>
          </div>
        )}

        <div className="relative z-10">
          <Routes>
            <Route path="/" element={<HomePage profile={coupleProfile} />} />
            <Route
              path="/journey"
              element={
                <ProtectedRoutePage
                  user={user}
                  authLoading={authLoading}
                  isSigningIn={isSigningIn}
                  onLogin={handleGoogleLogin}
                  authError={authError}
                >
                  {isUnlocked ? (
                    <JourneyPage
                      moments={timelineMoments}
                      tracks={songTracks}
                    />
                  ) : (
                    <LockedRoutePage remaining={remaining} />
                  )}
                </ProtectedRoutePage>
              }
            />
            <Route
              path="/reasons"
              element={
                <ProtectedRoutePage
                  user={user}
                  authLoading={authLoading}
                  isSigningIn={isSigningIn}
                  onLogin={handleGoogleLogin}
                  authError={authError}
                >
                  {isUnlocked ? (
                    <ReasonsPage
                      reasons={loveReasons}
                      profile={coupleProfile}
                    />
                  ) : (
                    <LockedRoutePage remaining={remaining} />
                  )}
                </ProtectedRoutePage>
              }
            />
            <Route
              path="/memories"
              element={
                <ProtectedRoutePage
                  user={user}
                  authLoading={authLoading}
                  isSigningIn={isSigningIn}
                  onLogin={handleGoogleLogin}
                  authError={authError}
                >
                  {isUnlocked ? (
                    <MemoriesPage frames={photoFrames} />
                  ) : (
                    <LockedRoutePage remaining={remaining} />
                  )}
                </ProtectedRoutePage>
              }
            />
            <Route
              path="/future"
              element={
                <ProtectedRoutePage
                  user={user}
                  authLoading={authLoading}
                  isSigningIn={isSigningIn}
                  onLogin={handleGoogleLogin}
                  authError={authError}
                >
                  {isUnlocked ? (
                    <FuturePage plans={futurePlans} promises={futurePromises} />
                  ) : (
                    <LockedRoutePage remaining={remaining} />
                  )}
                </ProtectedRoutePage>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoutePage
                  user={user}
                  authLoading={authLoading}
                  isSigningIn={isSigningIn}
                  onLogin={handleGoogleLogin}
                  authError={authError}
                  requireAdmin={true}
                  isAdmin={isAdmin}
                >
                  <AdminPanelPage user={user} />
                </ProtectedRoutePage>
              }
            />
          </Routes>
        </div>
      </main>
    </BrowserRouter>
  );
}
