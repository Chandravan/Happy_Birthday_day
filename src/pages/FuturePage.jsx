import { coupleProfile } from "../data/journeyData";

export default function FuturePage({ promises, plans }) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-8 sm:py-10">
      <div className="future-stage relative overflow-hidden rounded-[1.6rem] p-5 sm:rounded-[2rem] sm:p-10">
        <header className="future-hero relative z-10 rounded-[1.4rem] p-5 sm:rounded-[1.8rem] sm:p-8">
          <p className="tracking-love text-xs uppercase text-[#93452a]">
            Next Chapters
          </p>
          <h2 className="font-script mt-3 text-[2.65rem] leading-[0.9] text-[#672415] sm:text-7xl">
            Dear Future Us
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#6d3d30] sm:text-base">
            Yeh page un promises aur plans ke liye hai jo hum daily life me
            slowly build karenge. No rush, no pressure, just us and our future.
          </p>
        </header>

        <div className="relative z-10 mt-8 grid gap-4 sm:gap-5 lg:grid-cols-[1.1fr_1fr]">
          <article className="future-letter-card rounded-[1.5rem] p-5 sm:p-6">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#a25438]">
              A Letter
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#6a3d31] sm:text-base">
              {coupleProfile.partnerName}, I choose you in chaos, in calm, in
              distance, in closeness, in wins, and in overthinking days. Thank
              you for being my comfort, my energy, and my favorite person.
            </p>

            <h3 className="mt-6 text-xl font-semibold text-[#6f2a19]">
              My Promises
            </h3>
            <ul className="mt-3 space-y-3 text-sm text-[#6f4538]">
              {promises.map((item, idx) => (
                <li
                  key={item}
                  className="future-promise-item rounded-xl px-3 py-3"
                >
                  <span className="mr-2 text-[#a14c31]">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </article>

          <article className="future-plan-card rounded-[1.5rem] p-5 sm:p-6">
            <h3 className="text-xl font-semibold text-[#6f2a19]">Our Plan List</h3>
            <p className="mt-3 text-sm leading-relaxed text-[#6a3c30]">
              Hum dono milke life ke sare chote aur bade goals complete
              karenge, one memory at a time.
            </p>
            <ul className="mt-4 space-y-3">
              {plans.map((plan, idx) => (
                <li
                  key={plan}
                  className="future-plan-item rounded-xl border bg-white/82 px-3 py-3 text-sm text-[#6f4538]"
                >
                  <span className="mr-2 text-[#a14c31]">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  {plan}
                </li>
              ))}
            </ul>
          </article>
        </div>

        <footer className="relative z-10 mt-6 rounded-xl border border-[#f0cab8] bg-white/68 px-4 py-3">
          <p className="text-sm text-[#6f3d31]">
            Signed with love, {coupleProfile.yourName} to {coupleProfile.partnerName}
          </p>
        </footer>
      </div>
    </section>
  );
}
