export default function ReasonsPage({ reasons, profile }) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-8 sm:py-10">
      <div className="reasons-stage relative overflow-hidden rounded-[1.6rem] p-5 sm:rounded-[2rem] sm:p-10">
        <header className="reasons-hero relative z-10 rounded-[1.4rem] p-5 sm:rounded-[1.8rem] sm:p-8">
          <p className="tracking-love text-xs uppercase text-[#93452a]">
            Why I Love You
          </p>
          <h2 className="font-script mt-3 text-[2.65rem] leading-[0.9] text-[#672415] sm:text-7xl">
            12 Reasons For Anustha
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#6d3d30] sm:text-base">
            Har reason me thoda pyaar, thoda truth, aur bohot saara gratitude
            hai. Yeh page sirf tumhare liye banaya hai.
          </p>
        </header>

        <div className="relative z-10 mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {reasons.map((reason, idx) => (
            <article
              key={reason}
              className="reason-card rounded-[1.3rem] p-4"
              style={{ animationDelay: `${idx * 85}ms` }}
            >
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#9f5237]">
                Reason {String(idx + 1).padStart(2, "0")}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#6e4032] sm:text-base">
                {reason}
              </p>
            </article>
          ))}
        </div>

        <footer className="relative z-10 mt-6 rounded-xl border border-[#f0cab8] bg-white/68 px-4 py-3">
          <p className="text-sm text-[#6f3d31]">
            Still counting reasons, always - {profile.yourName}
          </p>
        </footer>
      </div>
    </section>
  );
}
