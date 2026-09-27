import Link from 'next/link'
import HomeHeader from '@/components/home-header'
import SubscribeButton from '@/components/subscribe-button'

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-paper text-ink font-sans flex flex-col justify-between">
      {/* Header Nav */}
      <HomeHeader />

      {/* Pricing Header */}
      <section className="max-w-4xl mx-auto px-6 pt-16 pb-12 text-center">
        <h1 className="font-serif text-4xl sm:text-5xl font-black text-ink mb-4">
          Pick the right plan for your business
        </h1>
        <p className="text-base text-ink/65 max-w-lg mx-auto font-light">
          Whether you're exploring your first micro-SaaS idea or scaling a product team, we've got you covered.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-4xl mx-auto px-6 mb-20 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Free Tier */}
          <div className="bg-white p-8 rounded-2xl border border-ink/10 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-ink/40">Free Tier</span>
              <h2 className="font-serif text-2xl font-bold text-ink mt-2 mb-4">Starter</h2>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="font-serif text-4xl font-black text-ink">₦0</span>
                <span className="text-sm text-ink/50">/ forever</span>
              </div>
              <ul className="space-y-3 text-sm text-ink/70 mb-8">
                <li className="flex items-center gap-2">✓ 3 Market Gap Analyses / month</li>
                <li className="flex items-center gap-2">✓ Up to 5 competitor apps per search</li>
                <li className="flex items-center gap-2">✓ Top 5 ranked market complaints</li>
                <li className="flex items-center gap-2">✓ Basic Markdown report copying</li>
              </ul>
            </div>
            <Link
              href="/signup"
              className="block text-center w-full border border-ink/20 text-ink font-bold py-3.5 rounded-xl hover:bg-ink/5 transition-all text-sm"
            >
              Get Started Free
            </Link>
          </div>

          {/* Pro Tier */}
          <div className="bg-ink text-paper p-8 rounded-2xl shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-lime text-ink text-[10px] font-bold uppercase px-2.5 py-1 rounded-full">
              Recommended
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-lime">Pro Tier</span>
              <h2 className="font-serif text-2xl font-bold text-paper mt-2 mb-4">Pro Founder</h2>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="font-serif text-4xl font-black text-paper">₦15,000</span>
                <span className="text-sm text-paper/60">/ month</span>
              </div>
              <ul className="space-y-3 text-sm text-paper/80 mb-8">
                <li className="flex items-center gap-2">✓ Unlimited Market Gap Analyses</li>
                <li className="flex items-center gap-2">✓ AI Dev Spec & PRD Generator</li>
                <li className="flex items-center gap-2">✓ PDF & CSV Export support</li>
                <li className="flex items-center gap-2">✓ Save & manage search history in Dashboard</li>
                <li className="flex items-center gap-2">✓ Priority Gemini AI processing</li>
              </ul>
            </div>
            <SubscribeButton
  className="block text-center w-full bg-lime text-ink font-bold py-3.5 
    rounded-xl hover:opacity-90 transition-all text-sm border-0 cursor-pointer"
>
  Subscribe — ₦15,000/mo →
</SubscribeButton>

            {/* <Link
              href="/dashboard"
              className="block text-center w-full bg-lime text-ink font-bold py-3.5 rounded-xl hover:opacity-90 transition-all text-sm"
            >
              Subscribe to Pro (₦15,000/mo) →
            </Link> */}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink/10 py-6 text-center text-xs text-ink/40">
        © 2026 ValidateIt. All rights reserved.
      </footer>
    </main>
  )
}

