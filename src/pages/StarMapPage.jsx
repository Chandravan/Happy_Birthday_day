import { useEffect, useMemo, useState } from "react";
import { coupleProfile, firstChatSky } from "../data/journeyData";

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

const brightStars = [
  { id: "sirius", name: "Sirius", raHours: 6.752, decDeg: -16.716, mag: -1.46 },
  { id: "canopus", name: "Canopus", raHours: 6.399, decDeg: -52.695, mag: -0.74 },
  { id: "arcturus", name: "Arcturus", raHours: 14.261, decDeg: 19.182, mag: -0.05 },
  { id: "vega", name: "Vega", raHours: 18.615, decDeg: 38.783, mag: 0.03 },
  { id: "capella", name: "Capella", raHours: 5.279, decDeg: 45.998, mag: 0.08 },
  { id: "rigel", name: "Rigel", raHours: 5.243, decDeg: -8.202, mag: 0.12 },
  { id: "procyon", name: "Procyon", raHours: 7.655, decDeg: 5.225, mag: 0.38 },
  { id: "betelgeuse", name: "Betelgeuse", raHours: 5.919, decDeg: 7.407, mag: 0.45 },
  { id: "achernar", name: "Achernar", raHours: 1.628, decDeg: -57.236, mag: 0.46 },
  { id: "hadar", name: "Hadar", raHours: 14.063, decDeg: -60.373, mag: 0.61 },
  { id: "altair", name: "Altair", raHours: 19.846, decDeg: 8.868, mag: 0.77 },
  { id: "aldebaran", name: "Aldebaran", raHours: 4.598, decDeg: 16.509, mag: 0.87 },
  { id: "spica", name: "Spica", raHours: 13.42, decDeg: -11.161, mag: 0.98 },
  { id: "antares", name: "Antares", raHours: 16.49, decDeg: -26.432, mag: 1.06 },
  { id: "pollux", name: "Pollux", raHours: 7.756, decDeg: 28.026, mag: 1.14 },
  { id: "fomalhaut", name: "Fomalhaut", raHours: 22.961, decDeg: -29.622, mag: 1.16 },
  { id: "deneb", name: "Deneb", raHours: 20.691, decDeg: 45.28, mag: 1.25 },
  { id: "regulus", name: "Regulus", raHours: 10.139, decDeg: 11.967, mag: 1.35 },
  { id: "adhara", name: "Adhara", raHours: 6.977, decDeg: -28.972, mag: 1.5 },
  { id: "shaula", name: "Shaula", raHours: 17.56, decDeg: -37.103, mag: 1.62 },
  { id: "bellatrix", name: "Bellatrix", raHours: 5.418, decDeg: 6.349, mag: 1.64 },
  { id: "elnath", name: "Elnath", raHours: 5.438, decDeg: 28.607, mag: 1.65 },
  { id: "alnilam", name: "Alnilam", raHours: 5.603, decDeg: -1.201, mag: 1.69 },
  { id: "alnitak", name: "Alnitak", raHours: 5.679, decDeg: -1.942, mag: 1.74 },
  { id: "mirfak", name: "Mirfak", raHours: 3.405, decDeg: 49.861, mag: 1.79 },
  { id: "dubhe", name: "Dubhe", raHours: 11.062, decDeg: 61.751, mag: 1.79 },
  { id: "merak", name: "Merak", raHours: 11.03, decDeg: 56.382, mag: 2.37 },
  { id: "polaris", name: "Polaris", raHours: 2.53, decDeg: 89.264, mag: 1.97 },
];

function clamp(min, value, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeDegrees(deg) {
  const normalized = deg % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function toJulianDate(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

function getGreenwichMeanSiderealTime(date) {
  const jd = toJulianDate(date);
  const t = (jd - 2451545.0) / 36525;
  const gmst =
    280.46061837 +
    360.98564736629 * (jd - 2451545) +
    0.000387933 * t * t -
    (t * t * t) / 38710000;
  return normalizeDegrees(gmst);
}

function getLocalSiderealTime(date, longitudeDeg) {
  return normalizeDegrees(getGreenwichMeanSiderealTime(date) + longitudeDeg);
}

function getAltAz(raHours, decDeg, date, latitudeDeg, longitudeDeg) {
  const raDeg = raHours * 15;
  const lst = getLocalSiderealTime(date, longitudeDeg);
  const hourAngleDeg = normalizeDegrees(lst - raDeg);

  const h = hourAngleDeg * DEG2RAD;
  const dec = decDeg * DEG2RAD;
  const lat = latitudeDeg * DEG2RAD;

  const sinAlt =
    Math.sin(dec) * Math.sin(lat) +
    Math.cos(dec) * Math.cos(lat) * Math.cos(h);
  const altitude = Math.asin(clamp(-1, sinAlt, 1));

  const cosAlt = Math.max(Math.cos(altitude), 1e-9);
  const sinAz = (-Math.sin(h) * Math.cos(dec)) / cosAlt;
  const cosAz =
    (Math.sin(dec) - Math.sin(altitude) * Math.sin(lat)) /
    (cosAlt * Math.cos(lat));
  let azimuth = Math.atan2(sinAz, cosAz);
  if (azimuth < 0) azimuth += Math.PI * 2;

  return {
    altitudeDeg: altitude * RAD2DEG,
    azimuthDeg: azimuth * RAD2DEG,
  };
}

function getCompassDirection(azimuthDeg) {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(azimuthDeg / 45) % 8;
  return directions[index];
}

function getSkyProjection(date, latitudeDeg, longitudeDeg) {
  return brightStars
    .map((star, index) => {
      const { altitudeDeg, azimuthDeg } = getAltAz(
        star.raHours,
        star.decDeg,
        date,
        latitudeDeg,
        longitudeDeg
      );

      if (altitudeDeg <= 0) return null;

      const radial = ((90 - altitudeDeg) / 90) * 46;
      const azRad = azimuthDeg * DEG2RAD;
      const x = 50 + radial * Math.sin(azRad);
      const y = 50 - radial * Math.cos(azRad);
      const size = clamp(2, 6 - star.mag * 1.15, 7);
      const opacity = clamp(0.44, 0.88 - star.mag * 0.08, 1);

      return {
        ...star,
        x,
        y,
        size,
        opacity,
        altitudeDeg,
        azimuthDeg,
        direction: getCompassDirection(azimuthDeg),
        twinkleDelay: (index % 7) * 0.17,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.mag - b.mag);
}

function formatIST(date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(date);
}

export default function StarMapPage() {
  const [timeOffsetMinutes, setTimeOffsetMinutes] = useState(0);
  const [activeStarId, setActiveStarId] = useState("sirius");

  const baseDate = useMemo(() => new Date(firstChatSky.dateTime), []);

  const observedDate = useMemo(
    () => new Date(baseDate.getTime() + timeOffsetMinutes * 60000),
    [baseDate, timeOffsetMinutes]
  );

  const projectedStars = useMemo(
    () =>
      getSkyProjection(
        observedDate,
        firstChatSky.latitude,
        firstChatSky.longitude
      ),
    [observedDate]
  );

  useEffect(() => {
    if (!projectedStars.length) return;
    if (!projectedStars.some((star) => star.id === activeStarId)) {
      setActiveStarId(projectedStars[0].id);
    }
  }, [activeStarId, projectedStars]);

  const activeStar =
    projectedStars.find((star) => star.id === activeStarId) || projectedStars[0];

  const localSiderealHours = (
    getLocalSiderealTime(observedDate, firstChatSky.longitude) / 15
  ).toFixed(2);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-8 sm:py-10">
      <div className="starmap-stage relative overflow-hidden rounded-[1.7rem] p-5 sm:rounded-[2.1rem] sm:p-10">
        <header className="starmap-hero relative z-10 rounded-[1.4rem] p-5 sm:rounded-[1.8rem] sm:p-8">
          <p className="tracking-love text-xs uppercase text-[#9a4c31]">
            First Chat Night
          </p>
          <h2 className="font-script mt-3 text-5xl leading-[0.9] text-[#662717] sm:text-7xl">
            Real Star Map
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#6f3e31] sm:text-base">
            This sky is calculated from real astronomical coordinates for the night
            where your story began. Earth rotates, stars shift, but{" "}
            {coupleProfile.partnerName} still stays your north star.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <article className="starmap-chip rounded-2xl px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#9f5338]">
                Location
              </p>
              <p className="mt-1 text-sm font-semibold text-[#6f2e1f]">
                {firstChatSky.locationName}
              </p>
            </article>
            <article className="starmap-chip rounded-2xl px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#9f5338]">
                Observed At
              </p>
              <p className="mt-1 text-sm font-semibold text-[#6f2e1f]">
                {formatIST(observedDate)}
              </p>
            </article>
            <article className="starmap-chip rounded-2xl px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#9f5338]">
                Visible Stars
              </p>
              <p className="mt-1 text-sm font-semibold text-[#6f2e1f]">
                {projectedStars.length}
              </p>
            </article>
            <article className="starmap-chip rounded-2xl px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#9f5338]">
                Local Sidereal
              </p>
              <p className="mt-1 text-sm font-semibold text-[#6f2e1f]">
                {localSiderealHours}h
              </p>
            </article>
          </div>

          <div className="starmap-time-control mt-6 rounded-2xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#9f5439]">
                Time Shift Around First Chat
              </p>
              <button
                type="button"
                onClick={() => setTimeOffsetMinutes(0)}
                className="starmap-reset-btn rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em]"
              >
                Reset To Exact Time
              </button>
            </div>
            <input
              type="range"
              min={-180}
              max={180}
              step={10}
              value={timeOffsetMinutes}
              onChange={(event) =>
                setTimeOffsetMinutes(Number(event.target.value))
              }
              className="starmap-range mt-4 w-full"
            />
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#97533c]">
              Offset: {timeOffsetMinutes > 0 ? "+" : ""}
              {timeOffsetMinutes} minutes
            </p>
          </div>
        </header>

        <div className="relative z-10 mt-8 grid gap-5 lg:grid-cols-[1.18fr_0.82fr]">
          <article className="starmap-observatory rounded-[1.5rem] p-5 sm:p-6">
            <div className="starmap-dome relative mx-auto aspect-square w-full max-w-[560px] overflow-hidden rounded-full">
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                viewBox="0 0 100 100"
                aria-hidden="true"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="rgba(255, 227, 207, 0.5)"
                  strokeWidth="0.45"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="31"
                  fill="none"
                  stroke="rgba(255, 227, 207, 0.24)"
                  strokeDasharray="1 1.3"
                  strokeWidth="0.32"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="16"
                  fill="none"
                  stroke="rgba(255, 227, 207, 0.2)"
                  strokeDasharray="1 1.3"
                  strokeWidth="0.32"
                />
                <line
                  x1="50"
                  y1="4"
                  x2="50"
                  y2="96"
                  stroke="rgba(255, 227, 207, 0.22)"
                  strokeWidth="0.3"
                />
                <line
                  x1="4"
                  y1="50"
                  x2="96"
                  y2="50"
                  stroke="rgba(255, 227, 207, 0.22)"
                  strokeWidth="0.3"
                />
              </svg>

              {projectedStars.map((star) => (
                <button
                  key={star.id}
                  type="button"
                  onClick={() => setActiveStarId(star.id)}
                  className={[
                    "starmap-star absolute -translate-x-1/2 -translate-y-1/2 rounded-full",
                    activeStar?.id === star.id ? "is-active" : "",
                  ].join(" ")}
                  style={{
                    left: `${star.x}%`,
                    top: `${star.y}%`,
                    width: `${star.size}px`,
                    height: `${star.size}px`,
                    opacity: star.opacity,
                    animationDelay: `${star.twinkleDelay}s`,
                  }}
                  title={star.name}
                >
                  <span className="sr-only">{star.name}</span>
                </button>
              ))}

              <span className="starmap-direction north">N</span>
              <span className="starmap-direction east">E</span>
              <span className="starmap-direction south">S</span>
              <span className="starmap-direction west">W</span>
            </div>
            <p className="mt-4 text-center text-xs text-[#9a5a45]">
              Mathematical model: GMST to LST to Hour Angle to Alt/Az projection
            </p>
          </article>

          <article className="starmap-info-card rounded-[1.5rem] p-5 sm:p-6">
            {activeStar ? (
              <>
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#9f5136]">
                  Focus Star
                </p>
                <h3 className="font-script mt-2 text-5xl leading-none text-[#6b2516] sm:text-6xl">
                  {activeStar.name}
                </h3>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <p className="starmap-detail-chip rounded-xl px-3 py-2 text-xs">
                    Mag {activeStar.mag.toFixed(2)}
                  </p>
                  <p className="starmap-detail-chip rounded-xl px-3 py-2 text-xs">
                    Alt {activeStar.altitudeDeg.toFixed(1)} deg
                  </p>
                  <p className="starmap-detail-chip rounded-xl px-3 py-2 text-xs">
                    Az {activeStar.azimuthDeg.toFixed(1)} deg
                  </p>
                  <p className="starmap-detail-chip rounded-xl px-3 py-2 text-xs">
                    Dir {activeStar.direction}
                  </p>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-[#6e3f32]">
                  The same sky physics that guides stars also keeps two hearts in
                  sync. This one is marked for {coupleProfile.partnerName}.
                </p>
              </>
            ) : (
              <p className="text-sm text-[#6e3f32]">
                No bright stars visible for this moment. Move time slider to see
                more.
              </p>
            )}

            <div className="mt-6">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#9f5136]">
                Brightest In View
              </p>
              <div className="mt-3 grid gap-2">
                {projectedStars.slice(0, 8).map((star) => (
                  <button
                    key={`list-${star.id}`}
                    type="button"
                    onClick={() => setActiveStarId(star.id)}
                    className={[
                      "starmap-list-item rounded-xl px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.12em]",
                      activeStar?.id === star.id ? "is-active" : "",
                    ].join(" ")}
                  >
                    {star.name} - {star.direction} - {star.altitudeDeg.toFixed(0)} deg
                  </button>
                ))}
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
