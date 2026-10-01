'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { pricing } from '@/lib/pricing'
import { isActivePro } from '@/lib/utils'
import { Profile } from '../type'

export default function PlanPage() {
  const router   = useRouter()
  const supabase = createClient()
  const [profile, setProfile]     = useState<Profile | null>(null)
  const [loading, setLoading]     = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) setProfile(data as Profile)
    }
    load()
  }, [])

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/subscribe', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert(data.error || 'Something went wrong')
    } catch {
      alert('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const quotaUsed    = profile?.credits_used    ?? 0
  const quotaLimit   = profile?.credits_limit   ?? 3
  const quotaPercent = Math.min((quotaUsed / quotaLimit) * 100, 100)
  const ddUsed       = (profile as any)?.deep_dive_used  ?? 0
  const ddLimit      = (profile as any)?.deep_dive_limit ?? 2
  const hasActivePlan = isActivePro(profile)

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-black text-ink mb-2">Your plan</h1>
        <p className="text-sm text-ink/55 font-light">Manage your subscription and usage.</p>
      </div>

      {/* Plan card */}
      <div className="bg-white p-8 rounded-2xl border border-ink/10 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-mono text-ink/35 uppercase tracking-widest mb-1">Current plan</p>
            <h2 className="font-serif text-2xl font-black text-ink capitalize">
              {hasActivePlan ? 'Pro' : 'Starter (Free)'}
            </h2>
          </div>
          {hasActivePlan && (
            <span className="bg-lime text-ink text-xs font-bold px-3 py-1.5 rounded-full">
              Active ✓
            </span>
          )}
        </div>

        {/* Market gap usage */}
        <div className="space-y-3 mb-5">
          <div className="flex justify-between text-xs font-mono text-ink/55">
            <span>Market gap analyses</span>
            <span className="font-bold">{quotaUsed} / {quotaLimit} used</span>
          </div>
          <div className="w-full bg-paper h-2 rounded-full overflow-hidden border border-ink/10">
            <div className="bg-lime h-full rounded-full transition-all" style={{ width: `${quotaPercent}%` }} />
          </div>
        </div>

        {/* Deep dive usage */}
        <div className="space-y-3 mb-8">
          <div className="flex justify-between text-xs font-mono text-ink/55">
            <span>Competitor deep dives</span>
            <span className="font-bold">{ddUsed} / {ddLimit} used</span>
          </div>
          <div className="w-full bg-paper h-2 rounded-full overflow-hidden border border-ink/10">
            <div
              className="bg-ink h-full rounded-full transition-all"
              style={{ width: `${Math.min((ddUsed / ddLimit) * 100, 100)}%` }}
            />
          </div>
        </div>

        {!hasActivePlan ? (
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-lime text-ink font-bold py-4 rounded-xl text-sm
              hover:opacity-90 transition-all border-0 cursor-pointer font-sans
              shadow-sm disabled:opacity-50"
          >
            {loading ? 'Redirecting...' : `Upgrade to Pro — ${pricing.pro.monthlyLabel} →`}
          </button>
        ) : (
          <div className="text-center text-sm text-ink/45 font-light">
            You're on Pro. Thank you for subscribing.
          </div>
        )}
      </div>

      {/* Pro features */}
      {!hasActivePlan && (
        <div className="bg-ink p-6 rounded-2xl">
          <p className="text-xs font-mono text-lime uppercase tracking-widest mb-4">Pro includes</p>
          <ul className="space-y-2.5">
            {[
              'Unlimited market gap analyses',
              'Unlimited competitor deep dives',
              'App Store + Play Store reviews',
              'Save unlimited reports',
              'PDF export',
              'Priority AI processing',
            ].map((f, i) => (
              <li key={i} className="flex items-center gap-2.5 text-sm text-paper/75 font-light">
                <span className="text-lime text-xs">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Account info */}
      {profile?.email && (
        <div className="bg-white p-5 rounded-2xl border border-ink/10">
          <p className="text-xs font-mono text-ink/35 mb-1">Account</p>
          <p className="text-sm font-medium text-ink">{profile.email}</p>
        </div>
      )}
    </div>
  )
}