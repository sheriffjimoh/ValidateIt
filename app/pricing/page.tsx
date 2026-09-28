
import HomeHeader from "@/components/home-header";
import PricingCards from "@/components/pricing-cards";

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
          Whether you're exploring your first micro-SaaS idea or scaling a
          product team, we've got you covered.
        </p>
      </section>

      {/* Pricing Cards */}
        <PricingCards />
      {/* Footer */}
      <footer className="border-t border-ink/10 py-6 text-center text-xs text-ink/40">
        © 2026 ValidateIt. All rights reserved.
      </footer>
    </main>
  );
}
