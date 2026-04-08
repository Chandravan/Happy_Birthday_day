import { useMemo } from "react";

const frameCaptions = [
  "Captured with love",
  "One smile, one universe",
  "Pure us energy",
  "Soft memory lane",
  "Frozen heartbeat moment",
  "A forever frame",
];

const frameMoods = [
  "Golden Hour",
  "Moonlight Date",
  "Soft Focus",
  "Warm Tones",
  "Dreamy Lens",
  "Love Archive",
];

export default function MemoriesPage({ frames }) {
  const floatingSparks = useMemo(
    () =>
      Array.from({ length: 16 }, (_, idx) => ({
        id: idx,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 8}s`,
        duration: `${9 + Math.random() * 8}s`,
        size: `${6 + Math.random() * 10}px`,
      })),
    []
  );

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-8 sm:py-10">
      <div className="memories-stage relative overflow-hidden rounded-[1.6rem] p-5 sm:rounded-[2rem] sm:p-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {floatingSparks.map((spark) => (
            <span
              key={spark.id}
              className="memory-float-spark"
              style={{
                left: spark.left,
                animationDelay: spark.delay,
                animationDuration: spark.duration,
                width: spark.size,
                height: spark.size,
              }}
            />
          ))}
        </div>

        <header className="memories-hero relative z-10 rounded-[1.4rem] p-5 sm:rounded-[1.8rem] sm:p-8">
          <p className="tracking-love text-xs uppercase text-[#93452a]">
            Memory Gallery
          </p>
          <h2 className="font-script mt-3 text-5xl leading-[0.9] text-[#672415] sm:text-7xl">
            Our Sweetest Frames
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#6d3d30] sm:text-base">
            Yeh gallery tum dono ke real photos ke liye optimized hai. Har card
            ek romantic frame hai jisme photo add karte hi page aur zyada
            emotional lagega.
          </p>
        </header>

        <div className="relative z-10 mt-5 grid gap-3 sm:grid-cols-3">
          <article className="memory-mini-stat rounded-2xl px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#9d4f34]">
              Total Frames
            </p>
            <p className="mt-1 text-2xl font-semibold text-[#6f2d1d]">{frames.length}</p>
          </article>
          <article className="memory-mini-stat rounded-2xl px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#9d4f34]">
              Vibe
            </p>
            <p className="mt-1 text-base font-semibold text-[#6f2d1d]">Cinematic Romance</p>
          </article>
          <article className="memory-mini-stat rounded-2xl px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#9d4f34]">
              Status
            </p>
            <p className="mt-1 text-base font-semibold text-[#6f2d1d]">Ready For Your Photos</p>
          </article>
        </div>

        <div className="relative z-10 mt-8 grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
          {frames.map((frame, idx) => (
            <article
              key={frame.id || frame.title}
              className="memory-photo-card group rounded-[1.5rem] p-4"
              style={{
                animationDelay: `${idx * 120}ms`,
                "--memory-tilt": idx % 2 === 0 ? "-0.9deg" : "0.9deg",
              }}
            >
              <div className="memory-photo-slot relative h-48 overflow-hidden rounded-[1.1rem] p-4 sm:h-52">
                {frame.imageUrl ? (
                  <img
                    src={frame.imageUrl}
                    alt={frame.title}
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : null}

                <div className="relative z-10">
                  <p className="w-fit rounded-full bg-white/84 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#a04e31]">
                    Slot {String(idx + 1).padStart(2, "0")}
                  </p>
                  <p className="absolute bottom-4 right-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#8d4b36]">
                    {frame.imageUrl ? "Photo Added" : "Add Photo"}
                  </p>
                  <p className="memory-slot-caption absolute inset-x-3 bottom-3 rounded-lg px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.17em]">
                    {frame.caption || "Hold this moment forever"}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#9f4f33]">
                  {frameCaptions[idx % frameCaptions.length]}
                </p>
                <h3 className="mt-1 text-xl font-semibold text-[#662718]">
                  {frame.title || `Memory ${idx + 1}`}
                </h3>
                <p className="mt-2 text-sm text-[#744538]">
                  {frame.vibe || "Pure us energy"}
                </p>
                <p className="mt-3 rounded-lg bg-[#ffe5d8] px-3 py-2 text-xs font-medium text-[#88402a]">
                  {frame.hint || "Add your favorite photo in this frame"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="memory-tag">
                    Scene {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="memory-tag">{frameMoods[idx % frameMoods.length]}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
