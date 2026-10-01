"use client";

import Link from "next/link";
import SubscribeButton from "@/components/subscribe-button";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { pricing } from "@/lib/pricing";
import { isActivePro } from "@/lib/utils";
import type { Profile } from "../app/dashboard/type";

export default function PricingCards() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const hasActivePro = isActivePro(profile);

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) setProfile(profileData as Profile);
    };
    loadUser();
  }, [supabase]);

  return (
    <section className="max-w-4xl mx-auto px-6 mb-20 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Free Tier */}

        <div className="bg-white p-8 rounded-2xl border border-ink/10 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-ink/40">
              Free Tier
            </span>
            <h2 className="font-serif text-2xl font-bold text-ink mt-2 mb-4">
              Starter
            </h2>

            {/* Matches the layout style of the Pro Tier with USD parity */}
            <div className="flex flex-col gap-0.5 mb-6">
              <div className="flex items-baseline gap-1.5">
                <span className="font-serif text-4xl font-black text-ink">
                  {pricing.free.label}
                </span>
                <span className="text-sm text-ink/50">/ forever</span>
              </div>
              <span className="text-xs font-mono text-ink/40 tracking-wide">
                No card required — {pricing.free.ngnLabel} NGN
              </span>
            </div>

            <ul className="space-y-3 text-sm text-ink/70 mb-8">
              <li className="flex items-center gap-2">
                ✓ 3 market-gap analyses per month
              </li>
              <li className="flex items-center gap-2">
                ✓ Up to 5 competitor apps per search
              </li>
              <li className="flex items-center gap-2">
                ✓ Top 5 ranked complaints by app
              </li>
              <li className="flex items-center gap-2">
                ✓ Quick report copying for your notes
              </li>
            </ul>
          </div>

          <Link
            href="/signup"
            className="block text-center w-full border border-ink/20 text-ink font-bold py-3.5 rounded-xl hover:bg-ink/5 transition-all text-sm"
          >
            Get Started Free
          </Link>
        </div>

        <div className="bg-ink text-paper p-8 rounded-2xl shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-4 right-4 bg-lime text-ink text-[10px] font-bold uppercase px-2.5 py-1 rounded-full">
            Recommended
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-lime">
              Pro Tier
            </span>
            <h2 className="font-serif text-2xl font-bold text-paper mt-2 mb-4">
              Pro Founder
            </h2>

            {/* Prominent USD pricing paired with absolute Naira transparency */}
            <div className="flex flex-col gap-0.5 mb-6">
              <div className="flex items-baseline gap-1.5">
                <span className="font-serif text-4xl font-black text-paper">
                  ~{pricing.pro.usdLabel}
                </span>
                <span className="text-sm text-paper/60">/ month</span>
              </div>
              <span className="text-xs font-mono text-lime/90 tracking-wide">
                {pricing.pro.checkoutText}
              </span>
            </div>

            <ul className="space-y-3 text-sm text-paper/80 mb-8">
              <li className="flex items-center gap-2">
                ✓ Unlimited market-gap analyses
              </li>
              <li className="flex items-center gap-2">
                ✓ Compare up to 8 competitor apps per search
              </li>
              <li className="flex items-center gap-2">
                ✓ AI dev spec & PRD generator
              </li>
              <li className="flex items-center gap-2">
                ✓ PDF & CSV export support
              </li>
              <li className="flex items-center gap-2">
                ✓ Save and manage search history in your dashboard
              </li>
              <li className="flex items-center gap-2">
                ✓ Faster AI processing for product decisions
              </li>
            </ul>
          </div>

          {profile ? (
            <SubscribeButton
              className="block text-center w-full bg-lime text-ink font-bold py-3.5 
      rounded-xl hover:opacity-90 transition-all text-sm border-0 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              disable={hasActivePro}
            >
              {hasActivePro
                ? "You are subscribed to Pro"
                : `Subscribe — ${pricing.pro.ngnLabel} (~${pricing.pro.usdLabel}) →`}
            </SubscribeButton>
          ) : (
            <Link
              href="/dashboard"
              className="block text-center w-full bg-lime text-ink font-bold py-3.5 rounded-xl hover:opacity-90 transition-all text-sm"
            >
              {`Subscribe to Pro — ${pricing.pro.ngnLabel} (~${pricing.pro.usdLabel}) →`}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
