import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

function getTogetherTime(startDate, now = new Date()) {
  const start = new Date(startDate);
  const today = now;
  const monthCount =
    (today.getFullYear() - start.getFullYear()) * 12 +
    (today.getMonth() - start.getMonth()) +
    (today.getDate() >= start.getDate() ? 0 : -1);

  const years = Math.max(0, Math.floor(monthCount / 12));
  const months = Math.max(0, monthCount % 12);
  return { years, months };
}

function getTogetherElapsed(startDate, now = new Date()) {
  const start = new Date(startDate).getTime();
  const current = now.getTime();
  const totalSeconds = Math.max(0, Math.floor((current - start) / 1000));

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
}

export default function HomePage({ profile }) {
  const [now, setNow] = useState(() => new Date());
  const { years, months } = getTogetherTime(profile.relationshipStart, now);
  const elapsed = getTogetherElapsed(profile.relationshipStart, now);
  const constellationStars = [
    {
      id: "spark",
      title: "First Spark",
      line: "Us raat sirf baat nahi hui thi… meri zindagi ne ek naya mod le liya tha, aur us mod par tu khadi thi.",
      left: 12,
      top: 68,
      size: 16,
    },
    {
      id: "laugh",
      title: "Your Laugh",
      line: "Teri hasi… sirf hasi nahi hai, woh wajah hai jisse meri har subah shuru hoti hai aur har gham khatam.",
      left: 28,
      top: 36,
      size: 14,
    },
    {
      id: "care",
      title: "Your Care",
      line: "Duniya ne kabhi itna nahi poocha jitna tu poochti hai… aur shayad isi liye tu meri duniya ban gayi.",
      left: 44,
      top: 58,
      size: 15,
    },
    {
      id: "trust",
      title: "Trust",
      line: "Rishte kismat se milte hain… par unhe nibhane ke liye jo himmat chahiye, woh humne ek dusre se seekhi hai.",
      left: 58,
      top: 30,
      size: 14,
    },
    {
      id: "comfort",
      title: "Comfort",
      line: "Tere saath rehkar mujhe kisi aur cheez ki zarurat nahi padti… kyunki tu hi mera sukoon hai.",
      left: 72,
      top: 62,
      size: 16,
    },
    {
      id: "forever",
      title: "Forever",
      line: "Yeh pyaar sirf aaj tak nahi… jab tak saansein chalti rahengi, tab tak main sirf tera hi rahunga.",
      left: 86,
      top: 38,
      size: 17,
    },
  ];
  const [activeStarId, setActiveStarId] = useState(constellationStars[0].id);
  const [revealedStars, setRevealedStars] = useState([
    constellationStars[0].id,
  ]);
  const activeStar =
    constellationStars.find((star) => star.id === activeStarId) ??
    constellationStars[0];
  const revealProgress = Math.round(
    (revealedStars.length / constellationStars.length) * 100,
  );
  const allStarsRevealed = revealedStars.length === constellationStars.length;

  const handleStarReveal = (star) => {
    setActiveStarId(star.id);
    setRevealedStars((prev) =>
      prev.includes(star.id) ? prev : [...prev, star.id],
    );
  };
  const floatingPetals = useMemo(
    () =>
      Array.from({ length: 16 }, (_, idx) => ({
        id: idx,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 6}s`,
        duration: `${8 + Math.random() * 8}s`,
        size: `${9 + Math.random() * 10}px`,
      })),
    [],
  );

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-8 sm:py-10">
      <div className="home-romance-stage relative overflow-hidden rounded-[1.6rem] p-5 sm:rounded-[2rem] sm:p-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {floatingPetals.map((petal) => (
            <span
              key={petal.id}
              className="home-float-petal"
              style={{
                left: petal.left,
                animationDelay: petal.delay,
                animationDuration: petal.duration,
                width: petal.size,
                height: petal.size,
              }}
            />
          ))}
        </div>

        <header className="relative z-10">
          <p className="tracking-love text-xs uppercase text-[#914228]">
            A Birthday Gift For {profile.partnerName}
          </p>

          <h1 className="font-script mt-5 text-[2.7rem] leading-[0.9] text-[#6a2414] sm:text-7xl md:text-8xl">
            Happy Birthday,
            <br />
            {profile.partnerNickname}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="home-heartbeat-badge rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em]">
              {profile.yourName} {"\u2665"} {profile.partnerName}
            </span>
            <span className="rounded-full bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#9a4c32] ring-1 ring-[#f0ccb9]">
              Together {years}y {months}m
            </span>
          </div>

          <div className="together-live-counter mt-4 rounded-2xl p-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#9a4e34]">
              Together Since 02 May 2025
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <article className="counter-unit rounded-xl p-3 text-center">
                <p className="text-xl font-semibold text-[#6b2a1b] sm:text-2xl">
                  {elapsed.days}
                </p>
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#9e5338]">
                  Days
                </p>
              </article>
              <article className="counter-unit rounded-xl p-3 text-center">
                <p className="text-xl font-semibold text-[#6b2a1b] sm:text-2xl">
                  {String(elapsed.hours).padStart(2, "0")}
                </p>
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#9e5338]">
                  Hours
                </p>
              </article>
              <article className="counter-unit rounded-xl p-3 text-center">
                <p className="text-xl font-semibold text-[#6b2a1b] sm:text-2xl">
                  {String(elapsed.minutes).padStart(2, "0")}
                </p>
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#9e5338]">
                  Minutes
                </p>
              </article>
              <article className="counter-unit rounded-xl p-3 text-center">
                <p className="text-xl font-semibold text-[#6b2a1b] sm:text-2xl">
                  {String(elapsed.seconds).padStart(2, "0")}
                </p>
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#9e5338]">
                  Seconds
                </p>
              </article>
            </div>
          </div>

          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#6f3e31] sm:text-base">
            A minimal love letter, made just for her.
          </p>

          <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap">
            <Link
              to="/journey"
              className="home-cta-primary block w-full rounded-full px-7 py-3 text-center text-sm font-semibold text-white sm:w-auto"
            >
              Open Our Journey
            </Link>
            <Link
              to="/memories"
              className="home-cta-secondary block w-full rounded-full px-7 py-3 text-center text-sm font-semibold sm:w-auto"
            >
              Open Memory Gallery
            </Link>
            <Link
              to="/future"
              className="home-cta-secondary block w-full rounded-full px-7 py-3 text-center text-sm font-semibold sm:w-auto"
            >
              Read Future Letter
            </Link>
          </div>
        </header>

        <section className="home-signature-grid relative z-10 mt-8 grid gap-3 sm:grid-cols-3">
          <article className="home-signature-card rounded-2xl p-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#9a4e34]">
              First Vibe
            </p>
            <p className="mt-2 text-base font-semibold text-[#672718] sm:text-lg">
              Late Night Talks
            </p>
          </article>
          <article className="home-signature-card rounded-2xl p-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#9a4e34]">
              Current Mood
            </p>
            <p className="mt-2 text-base font-semibold text-[#672718] sm:text-lg">
              Still Choosing Us
            </p>
          </article>
          <article className="home-signature-card rounded-2xl p-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#9a4e34]">
              Promise
            </p>
            <p className="mt-2 text-base font-semibold text-[#672718] sm:text-lg">
              Forever Soft Love
            </p>
          </article>
        </section>

        <section className="relative z-10 mt-8 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <article className="constellation-stage rounded-[1.6rem] p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#9d4f34]">
                  Unique For Her
                </p>
                <h2 className="font-display mt-2 text-3xl text-[#632516] sm:text-4xl">
                  Our Love Constellation
                </h2>
              </div>

              <div className="constellation-progress-box rounded-xl px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#9c5136]">
                  Revealed
                </p>
                <p className="mt-1 text-lg font-semibold text-[#652717]">
                  {revealedStars.length}/{constellationStars.length}
                </p>
              </div>
            </div>

            <div className="constellation-progress-track mt-4">
              <div
                className="constellation-progress-fill"
                style={{ width: `${revealProgress}%` }}
              />
            </div>

            <div className="constellation-map relative mt-5 h-[260px] overflow-hidden rounded-[1.3rem] p-3 sm:h-[320px]">
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <polyline
                  points={constellationStars
                    .map((star) => `${star.left},${star.top}`)
                    .join(" ")}
                  fill="none"
                  stroke="rgba(255, 220, 198, 0.34)"
                  strokeWidth="0.56"
                  strokeDasharray="1.3 1.05"
                />
                <polyline
                  points={constellationStars
                    .filter((star) => revealedStars.includes(star.id))
                    .map((star) => `${star.left},${star.top}`)
                    .join(" ")}
                  fill="none"
                  stroke="rgba(255, 242, 228, 0.88)"
                  strokeWidth="0.82"
                  strokeLinecap="round"
                />
              </svg>

              {constellationStars.map((star) => {
                const isActive = activeStar.id === star.id;
                const isRevealed = revealedStars.includes(star.id);
                return (
                  <button
                    key={star.id}
                    type="button"
                    onClick={() => handleStarReveal(star)}
                    className={[
                      "constellation-star absolute -translate-x-1/2 -translate-y-1/2 rounded-full",
                      isActive ? "is-active" : "",
                      isRevealed ? "is-revealed" : "",
                    ].join(" ")}
                    style={{
                      left: `${star.left}%`,
                      top: `${star.top}%`,
                      width: `${star.size}px`,
                      height: `${star.size}px`,
                    }}
                  >
                    <span className="sr-only">{star.title}</span>
                  </button>
                );
              })}
            </div>
          </article>

          <article className="constellation-note-card rounded-[1.6rem] p-5 sm:p-6">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#9d4f34]">
              Selected Star
            </p>
            <h3 className="font-script mt-2 text-[2.45rem] leading-none text-[#6a2415] sm:text-6xl">
              {activeStar.title}
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-[#6f4034] sm:text-base">
              {activeStar.line}
            </p>
            <p className="mt-5 rounded-xl bg-white/72 px-3 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#8f4930] ring-1 ring-[#f0ccb9]">
              Every star points to Anustha, my favorite universe
            </p>

            {allStarsRevealed ? (
              <div className="constellation-final-note mt-5 rounded-xl px-3 py-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#9b4d32]">
                  Final Reveal
                </p>
                <p className="mt-2 text-sm text-[#6e3f31]">
                  All stars aligned. No matter how big the sky gets, my one true
                  north will always be Anustha.
                </p>
              </div>
            ) : (
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-[#99533a]">
                Reveal all stars to unlock final line
              </p>
            )}
          </article>
        </section>
      </div>
    </section>
  );
}
