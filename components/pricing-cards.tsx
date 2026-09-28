"use client";

import Link from "next/link";
import SubscribeButton from "@/components/subscribe-button";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "../app/dashboard/type";

export default function PricingCards() {
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);

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
  }, []);

  console.log(profile);
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
                  $0
                </span>
                <span className="text-sm text-ink/50">/ forever</span>
              </div>
              <span className="text-xs font-mono text-ink/40 tracking-wide">
                No card required — ₦0 NGN
              </span>
            </div>

            <ul className="space-y-3 text-sm text-ink/70 mb-8">
              <li className="flex items-center gap-2">
                ✓ 3 Market Gap Analyses / month
              </li>
              <li className="flex items-center gap-2">
                ✓ Up to 5 competitor apps per search
              </li>
              <li className="flex items-center gap-2">
                ✓ Top 5 ranked market complaints
              </li>
              <li className="flex items-center gap-2">
                ✓ Basic Markdown report copying
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
                  ~$11.00
                </span>
                <span className="text-sm text-paper/60">/ month</span>
              </div>
              <span className="text-xs font-mono text-lime/90 tracking-wide">
                Billed as ₦15,000 NGN at checkout
              </span>
            </div>

            <ul className="space-y-3 text-sm text-paper/80 mb-8">
              <li className="flex items-center gap-2">
                ✓ Unlimited Market Gap Analyses
              </li>
              <li className="flex items-center gap-2">
                ✓ AI Dev Spec & PRD Generator
              </li>
              <li className="flex items-center gap-2">
                ✓ PDF & CSV Export support
              </li>
              <li className="flex items-center gap-2">
                ✓ Save & manage search history in Dashboard
              </li>
              <li className="flex items-center gap-2">
                ✓ Priority Gemini AI processing
              </li>
            </ul>
          </div>

          {profile ? (
            <SubscribeButton
              className="block text-center w-full bg-lime text-ink font-bold py-3.5 
      rounded-xl hover:opacity-90 transition-all text-sm border-0 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              disable={profile?.subscription_status === "active"}
            >
              {profile?.subscription_status === "active"
                ? "You are subscribed to Pro"
                : "Subscribe — ₦15,000 (~$11.00) →"}
            </SubscribeButton>
          ) : (
            <Link
              href="/dashboard"
              className="block text-center w-full bg-lime text-ink font-bold py-3.5 rounded-xl hover:opacity-90 transition-all text-sm"
            >
              Subscribe to Pro — ₦15,000 (~$11.00) →
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
