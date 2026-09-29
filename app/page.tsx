import Link from 'next/link'
import HomeHeader from '@/components/home-header'
import { GAPS } from '@/lib/utils'


export default function Home() {
  return (
    <div className="min-h-screen bg-paper font-sans">

      {/* ── NAV ── */}
       <HomeHeader />
      {/* ── HERO ── */}
      <section className="mx-auto max-w-3xl px-6 pb-16 pt-20 text-center">

        <h1 className="mb-5 font-serif text-[52px] font-black leading-[1.05] tracking-[-2px] text-ink sm:text-[64px]">
          Build what users<br />
          <span className="bg-lime px-2 italic">are begging for.</span>
        </h1>

        <p className="mx-auto mb-8 max-w-md text-[16px] font-light leading-relaxed text-ink/60">
          ValidateIt mines competitor 1-star & 2-star App Store reviews and surfaces the gaps users keep complaining about.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/signup" className="rounded-xl bg-ink px-7 py-3.5 text-[14px] font-bold text-paper shadow-sm hover:opacity-90 transition-opacity">
            Start free, no card needed
          </Link>
          <Link href="/pricing" className="rounded-xl border border-ink/15 bg-white px-6 py-3.5 text-[14px] font-semibold text-ink hover:bg-ink/5 transition-colors">
            See pricing
          </Link>
        </div>
        <p className="mt-3 text-[11px] text-ink/35">3 free analyses per month · Upgrade when you need more</p>
      </section>

      {/* ── MOCK REPORT ── */}
      <section className="mx-auto mb-20 max-w-2xl px-6">
        <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-[0_8px_40px_rgba(0,0,0,0.07)]">
          {/* fake browser chrome */}
          <div className="flex items-center gap-1.5 border-b border-ink/[0.06] bg-[#F7F7F7] px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF6B6B]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#FFCA3A]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#6BCB77]" />
            <div className="ml-2 h-5 flex-1 rounded-md bg-ink/5" />
          </div>

          {/* report header */}
          <div className="flex items-center justify-between border-b border-ink/[0.06] px-5 py-4">
            <div>
              <p className="text-[13px] font-semibold text-ink">Invoicing apps for freelancers</p>
              <p className="text-[11px] text-ink/40">4 apps · 2,847 reviews analyzed</p>
            </div>
            <span className="rounded-md bg-lime px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-ink">
              Live
            </span>
          </div>

          {/* rows */}
          {GAPS.map((g) => (
            <div key={g.rank} className="flex items-center gap-4 border-b border-ink/[0.04] px-5 py-3.5 last:border-0">
              <span className="w-4 font-mono text-[11px] text-ink/25">{g.rank}</span>
              <span className={`flex-1 text-[13px] ${g.hot ? 'font-medium text-ink' : 'text-ink/45'}`}>{g.text}</span>
              <span className={`font-mono text-[11px] ${g.hot ? 'font-semibold text-ink' : 'text-ink/30'}`}>
                ~{g.mentions}
              </span>
            </div>
          ))}

          <div className="px-5 py-3 text-[11px] text-ink/30">
            Freshbooks · Wave · Invoice Ninja · AND.CO
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS (3 cols) ── */}
      <section className="mx-auto mb-20 max-w-5xl px-6">
        <p className="mb-10 text-center font-mono text-[10px] uppercase tracking-[3px] text-ink/30">
          How it works
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { n: '01', title: 'Describe your market', body: 'Type a niche like "invoicing for freelancers" or "meditation for anxiety".' },
            { n: '02', title: 'Pick competitors', body: 'Select up to 5 App Store apps. We fetch their 1★ and 2★ reviews.' },
            { n: '03', title: 'Build with evidence', body: 'Get a ranked AI report of the most-wanted features — sorted by frequency.' },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl border border-ink/[0.08] bg-white p-6">
              <span className="font-mono text-[10px] font-bold tracking-widest text-ink/25">{s.n}</span>
              <h3 className="mt-3 mb-2 font-serif text-[18px] font-bold text-ink">{s.title}</h3>
              <p className="text-[13px] font-light leading-relaxed text-ink/55">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="bg-ink py-20 text-center">
        <h2 className="mb-3 font-serif text-[40px] font-black leading-tight tracking-tight text-paper sm:text-[50px]">
          Stop guessing.<br />Start validating.
        </h2>
        <p className="mb-8 text-[15px] font-light text-paper/50">
          Join founders building features with real market proof.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/signup" className="rounded-xl bg-lime px-7 py-3.5 text-[14px] font-black text-ink hover:opacity-90 transition-opacity">
            Start free →
          </Link>
          <Link href="/pricing" className="rounded-xl border border-paper/15 px-6 py-3.5 text-[14px] font-semibold text-paper/70 hover:text-paper transition-colors">
            View pricing
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-ink/[0.07] px-6 py-5">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="font-serif text-[14px] font-black text-ink">ValidateIt</span>
          <span className="text-[11px] text-ink/30">© 2026</span>
        </div>
      </footer>

    </div>
  )
}