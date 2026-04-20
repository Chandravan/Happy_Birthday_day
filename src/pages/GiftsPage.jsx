import { useEffect, useMemo, useState } from "react";

const LOCAL_UNLOCK_KEY = "gift_vault_unlocked";
const DEFAULT_SECRET_KEY = "ourforevergift";
const DEFAULT_HIM_IMAGE = "/images/him-placeholder.svg";
const DEFAULT_HER_IMAGE = "/images/her-placeholder.svg";

export default function GiftsPage({
  giftsFromHim = [],
  giftsFromHer = [],
  profile,
}) {
  const expectedKey = useMemo(() => {
    const fromEnv = (import.meta.env.VITE_GIFT_SECRET_KEY || "").trim();
    return fromEnv || DEFAULT_SECRET_KEY;
  }, []);

  const [secretInput, setSecretInput] = useState("");
  const [secretError, setSecretError] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState("her");
  const [brokenImages, setBrokenImages] = useState({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    const alreadyUnlocked = window.localStorage.getItem(LOCAL_UNLOCK_KEY) === "1";
    setUnlocked(alreadyUnlocked);
  }, []);

  const unlockVault = (event) => {
    event.preventDefault();

    if (secretInput.trim() !== expectedKey) {
      setSecretError("Wrong secret key. Dobara try karo.");
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCAL_UNLOCK_KEY, "1");
    }

    setSecretError("");
    setUnlocked(true);
  };

  const lockAgain = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(LOCAL_UNLOCK_KEY);
    }
    setUnlocked(false);
    setSecretInput("");
    setSecretError("");
    setActiveSectionId("her");
  };

  const sections = useMemo(
    () => [
      {
        id: "her",
        title: "Gift Given By Her",
        items: giftsFromHer,
        personName: profile?.partnerName || "Her",
        image: profile?.partnerPhoto || DEFAULT_HER_IMAGE,
        fallbackImage: DEFAULT_HER_IMAGE,
      },
      {
        id: "him",
        title: "Gift Given By Him",
        items: giftsFromHim,
        personName: profile?.yourName || "Him",
        image: profile?.yourPhoto || DEFAULT_HIM_IMAGE,
        fallbackImage: DEFAULT_HIM_IMAGE,
      },
    ],
    [
      giftsFromHer,
      giftsFromHim,
      profile?.partnerName,
      profile?.partnerPhoto,
      profile?.yourName,
      profile?.yourPhoto,
    ],
  );

  useEffect(() => {
    if (!sections.some((section) => section.id === activeSectionId)) {
      setActiveSectionId(sections[0]?.id || "him");
    }
  }, [activeSectionId, sections]);

  const activeSection =
    sections.find((section) => section.id === activeSectionId) || sections[0];

  const resolveImageSrc = (section) => {
    if (!section?.image || brokenImages[section.id]) {
      return section.fallbackImage;
    }
    return section.image;
  };

  const markImageBroken = (section) => {
    setBrokenImages((previous) => {
      if (previous[section.id]) return previous;
      return { ...previous, [section.id]: true };
    });
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-8 sm:py-10">
      <div className="countdown-lock-card relative overflow-hidden rounded-[1.6rem] p-5 sm:rounded-[2rem] sm:p-10">
        {!unlocked && (
          <div className="absolute inset-0 z-30 bg-[#2d110bbf] backdrop-blur-[2px]">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="w-full max-w-md rounded-2xl border border-[#f3cfbf] bg-[#fff8f3] p-5 shadow-2xl sm:p-6">
                <p className="tracking-love text-xs uppercase text-[#93452a]">
                  Gift Vault Locked
                </p>
                <h3 className="font-script mt-3 text-[2.45rem] leading-none text-[#672415] sm:text-5xl">
                  Secret Key
                </h3>
                <p className="mt-3 text-sm text-[#6d3d30]">
                  You need a secret key to view this page.
                </p>

                <form className="mt-4" onSubmit={unlockVault}>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9a4d33]">
                    Enter Secret Key
                    <input
                      type="password"
                      value={secretInput}
                      onChange={(event) => setSecretInput(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-[#e8c2b0] bg-white px-3 py-2 text-sm text-[#5f2616] outline-none focus:border-[#ca6642]"
                      placeholder="Type key..."
                      required
                    />
                  </label>

                  {secretError && (
                    <p className="mt-3 rounded-lg border border-[#da7e5f] bg-[#fff2ea] px-3 py-2 text-sm text-[#8f351e]">
                      {secretError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="unlock-love-btn mt-4 inline-flex w-full justify-center rounded-full px-6 py-2 text-sm font-semibold text-white sm:w-auto"
                  >
                    Unlock Gift Page
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        <header className="relative z-10">
          <p className="tracking-love text-xs uppercase text-[#93452a]">Private Gift Space</p>
          <h2 className="font-script mt-3 text-[2.65rem] leading-[0.9] text-[#672415] sm:text-7xl">
            Gift Vault
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#6d3d30] sm:text-base">
            Special gifts between {profile?.yourName || "him"} and{" "}
            {profile?.partnerName || "her"}.
          </p>
          {unlocked && (
            <button
              type="button"
              onClick={lockAgain}
              className="mt-4 w-full rounded-full border border-[#cf8262] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8f3d24] transition hover:bg-[#ffe8dc] sm:w-auto"
            >
              Lock Page Again
            </button>
          )}
        </header>

        <div className="relative z-10 mt-8 rounded-[1.5rem] border border-[#f0cdbf] bg-[#fff9f5] p-4 sm:p-6">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#9d4f34]">
            Choose Whose Gifts To Open
          </p>
          <p className="mt-2 text-sm text-[#7a4b3b]">
            Left me {profile?.partnerName || "her"}, right me{" "}
            {profile?.yourName || "him"}.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-4 sm:gap-8">
          {sections.map((section) => {
            const isActive = activeSection?.id === section.id;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSectionId(section.id)}
                className={[
                  "flex flex-col items-center text-center transition",
                  isActive ? "scale-[1.01]" : "",
                ].join(" ")}
              >
                <div
                  className={[
                    "relative h-28 w-28 overflow-hidden rounded-full border-2 sm:h-40 sm:w-40",
                    isActive
                      ? "border-[#d6724f] shadow-[0_14px_28px_rgba(143,56,29,0.22)]"
                      : "border-[#f1d6c9]",
                  ].join(" ")}
                >
                  <img
                    src={resolveImageSrc(section)}
                    alt={`${section.personName} profile`}
                    className="h-full w-full rounded-full object-cover"
                    loading="lazy"
                    onError={() => markImageBroken(section)}
                  />
                </div>

                <p className="mt-3 text-sm font-semibold text-[#6f2d1d] sm:text-base">
                  {section.personName}
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[#9d4f34]">
                  {section.id === "her" ? "Left Side" : "Right Side"}
                </p>
                <p className="mt-1 text-xs text-[#7a4b3b]">
                  {isActive
                    ? "Opened now"
                    : "Tap to open"}
                </p>
              </button>
            );
          })}
          </div>
        </div>

        {activeSection && (
          <article className="relative z-10 mt-5 rounded-[1.5rem] border border-[#f0cdbf] bg-[#fff9f5] p-5 sm:p-6">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#9d4f34]">
              {activeSection.title}
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-[#6f2d1d] sm:text-3xl">
              {activeSection.personName} ke gifts
            </h3>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {activeSection.items.length === 0 ? (
                <p className="text-sm text-[#8d5441]">No gifts added yet.</p>
              ) : (
                activeSection.items.map((gift, index) => (
                  <div
                    key={`${activeSection.id}-${gift.title}-${index}`}
                    className="rounded-xl border border-[#edd0c4] bg-white p-4"
                  >
                    {gift.imageUrl ? (
                      <div className="mb-3 h-40 overflow-hidden rounded-lg bg-[#ffe8db]">
                        <img
                          src={gift.imageUrl}
                          alt={gift.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : null}
                    <p className="text-sm font-semibold text-[#6f2d1d]">{gift.title}</p>
                    <p className="mt-2 text-sm text-[#7a4b3b]">{gift.detail}</p>
                  </div>
                ))
              )}
            </div>
          </article>
        )}
      </div>
    </section>
  );
}
