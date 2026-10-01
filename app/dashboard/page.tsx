'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { isActivePro } from '@/lib/utils'
import { Analysis, App, Profile } from './type'

type StoreOption = 'appstore' | 'playstore' | 'both'

export default function ValidatePage() {
  const router   = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [step, setStep]       = useState<'search' | 'select' | 'analyse' | 'results'>('search')
  const [market, setMarket]   = useState('')
  const [store, setStore]     = useState<StoreOption>('both')
  const [apps, setApps]       = useState<App[]>([])
  const [selectedApps, setSelectedApps] = useState<App[]>([])
  const [analysis, setAnalysis]         = useState<Analysis | null>(null)
  const [reviewCount, setReviewCount]   = useState(0)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [saving, setSaving]             = useState(false)
  const [copied, setCopied]             = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) setProfile(data as Profile)
    }
    loadProfile()
  }, [])

  // ── Step 1: Search apps ────────────────────────────────────────────────────
  const searchApps = async (e?: React.FormEvent, customMarket?: string) => {
    if (e) e.preventDefault()
    const q = customMarket || market
    if (!q.trim()) return
    setLoading(true)
    setError('')

    try {
      // Search one or both stores in parallel
      const promises = []
      if (store === 'appstore' || store === 'both') {
        promises.push(
          fetch(`/api/search-apps?q=${encodeURIComponent(q)}`)
            .then(r => r.json())
            .then(d => (d.apps || []).map((a: App) => ({ ...a, store: 'appstore' as const })))
        )
      }
      if (store === 'playstore' || store === 'both') {
        promises.push(
          fetch(`/api/search-playstore?q=${encodeURIComponent(q)}`)
            .then(r => r.json())
            .then(d => (d.apps || []).map((a: App) => ({ ...a, store: 'playstore' as const })))
        )
      }

      const results  = await Promise.all(promises)
      const allApps  = results.flat()

      // Deduplicate by name (same app can appear in both stores)
      const seen = new Set<string>()
      const unique = allApps.filter(a => {
        const key = a.name.toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })

      setApps(unique.slice(0, 8))
      setStep('select')
    } catch {
      setError('Could not find apps. Try a different search term.')
    } finally {
      setLoading(false)
    }
  }

  const toggleApp = (app: App) => {
    setSelectedApps(prev =>
      prev.find(a => a.id === app.id)
        ? prev.filter(a => a.id !== app.id)
        : prev.length < 5 ? [...prev, app] : prev
    )
  }

  // ── Step 2: Run analysis ───────────────────────────────────────────────────
  const runAnalysis = async () => {
    if (selectedApps.length === 0) return
    if (!isActivePro(profile) && (profile?.credits_used ?? 0) >= (profile?.credits_limit ?? 3)) {
      setError('You\'ve used all your free analyses this month. Upgrade to Pro for unlimited.')
      return
    }

    setLoading(true)
    setError('')
    setStep('analyse')

    try {
      // Fetch reviews from the correct store for each app
      const reviewResults = await Promise.all(
        selectedApps.map(app => {
          const endpoint = app.store === 'playstore'
            ? `/api/fetch-playstore?appId=${app.id}`
            : `/api/fetch-reviews?appId=${app.id}`
          return fetch(endpoint).then(r => r.json())
        })
      )

      const allReviews = reviewResults.flatMap(r => r.reviews || [])
      const total      = reviewResults.reduce((sum, r) => sum + (r.total || 0), 0)
      setReviewCount(total)

      if (allReviews.length === 0) throw new Error('No reviews found. Try different apps.')

      const res = await fetch('/api/analyse', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ market, apps: selectedApps, reviews: allReviews }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setAnalysis(data.analysis)
      setStep('results')

      if (profile) {
        const newCount = (profile.credits_used ?? 0) + 1
        await supabase.from('profiles').update({ credits_used: newCount }).eq('id', profile.id)
        setProfile(p => p ? { ...p, credits_used: newCount } : p)
      }
    } catch (err: any) {
      setError(err.message || 'Analysis failed.')
      setStep('select')
    } finally {
      setLoading(false)
    }
  }

  // ── Save report ────────────────────────────────────────────────────────────
  const saveReport = async () => {
    if (!analysis || !market) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const { error: saveError } = await supabase.from('saved_searches').insert({
      user_id:       user.id,
      market_query:  market,
      selected_apps: selectedApps,
      review_count:  reviewCount,
      analysis,
    })

    if (saveError) setError('Failed to save. Try again.')
    else router.push('/dashboard/saved')
    setSaving(false)
  }

  const copyReport = () => {
    if (!analysis) return
    const text = analysis.gaps
      .map(g => `${g.rank}. ${g.complaint} (~${g.mentions}) — ${g.opportunity}`)
      .join('\n')
    navigator.clipboard.writeText(`Market gaps in "${market}":\n\n${text}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const reset = () => {
    setStep('search')
    setMarket('')
    setApps([])
    setSelectedApps([])
    setAnalysis(null)
    setError('')
  }

  const storeLabel = (s: string) =>
    s === 'appstore' ? '🍎' : s === 'playstore' ? '🤖' : ''

  return (
    <div>
      <div className="flex items-center justify-between text-xs font-mono text-ink/40 mb-6 uppercase tracking-wider">
        <span>
          {step === 'search' ? 'Step 1 of 3 — Describe your market'
            : step === 'select' ? 'Step 2 of 3 — Pick competitors'
            : step === 'results' ? 'Step 3 of 3 — Your results'
            : 'Analysing...'}
        </span>
        {step !== 'search' && (
          <button onClick={reset} className="hover:text-ink cursor-pointer bg-transparent border-0 font-sans">
            ← New search
          </button>
        )}
      </div>

      {/* ── STEP 1: SEARCH ── */}
      {step === 'search' && (
        <div className="max-w-2xl">
          <h1 className="font-serif text-3xl font-black text-ink mb-2">Validate a market</h1>
          <p className="text-sm text-ink/55 font-light mb-8">
            Find what users of competing apps are desperately asking for.
          </p>

          {/* Store selector */}
          <div className="flex gap-2 mb-5">
            {([
              { val: 'both',      label: '🍎🤖 Both stores' },
              { val: 'appstore',  label: '🍎 App Store'     },
              { val: 'playstore', label: '🤖 Play Store'    },
            ] as { val: StoreOption; label: string }[]).map(s => (
              <button
                key={s.val}
                onClick={() => setStore(s.val)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer font-sans transition-all
                  ${store === s.val
                    ? 'bg-ink text-paper border-ink'
                    : 'bg-white text-ink/50 border-ink/15 hover:border-ink/30'
                  }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <form onSubmit={searchApps} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 bg-white p-2 rounded-2xl border border-ink/15 shadow-sm">
              <input
                type="text"
                value={market}
                onChange={e => setMarket(e.target.value)}
                placeholder="e.g. habit tracker for students"
                required
                className="flex-1 bg-transparent text-ink px-4 py-3 text-sm focus:outline-none placeholder-ink/30"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-lime text-ink font-bold px-8 py-3 rounded-xl text-sm
                  hover:opacity-90 transition-all cursor-pointer border-0 font-sans disabled:opacity-40"
              >
                {loading ? 'Searching...' : 'Find competitors →'}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {['invoicing for freelancers', 'meditation for anxiety', 'language learning app', 'habit tracker'].map(ex => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => { setMarket(ex); searchApps(undefined, ex) }}
                  className="bg-white border border-ink/10 text-ink/60 hover:text-ink
                    px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer font-sans"
                >
                  {ex}
                </button>
              ))}
            </div>
          </form>

          {error && <p className="text-red-500 text-xs mt-4">{error}</p>}

          {/* Quota warning */}
          {profile?.plan_type === 'free' && (
            <div className="mt-8 bg-white border border-ink/10 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-ink">
                  {profile.credits_used ?? 0} of {profile.credits_limit ?? 3} free analyses used
                </p>
                <div className="w-40 bg-paper h-1.5 rounded-full mt-1.5 border border-ink/10 overflow-hidden">
                  <div
                    className="bg-lime h-full rounded-full"
                    style={{ width: `${Math.min(((profile.credits_used ?? 0) / (profile.credits_limit ?? 3)) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <a href="/dashboard/plan" className="text-xs font-bold text-ink underline">
                Upgrade →
              </a>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2: SELECT ── */}
      {step === 'select' && (
        <div className="max-w-2xl">
          <h2 className="font-serif text-3xl font-black text-ink mb-2">Pick competitors</h2>
          <p className="text-sm text-ink/55 font-light mb-8">
            Select up to 5 apps for <strong>"{market}"</strong>. We'll read their 1★ and 2★ reviews.
          </p>

          <div className="space-y-2 mb-8">
            {apps.map(app => {
              const isSelected = !!selectedApps.find(a => a.id === app.id)
              return (
                <button
                  key={`${app.id}-${app.store}`}
                  onClick={() => toggleApp(app)}
                  className={`w-full text-left p-4 rounded-xl border transition-all
                    flex items-center justify-between gap-4 cursor-pointer font-sans
                    ${isSelected
                      ? 'bg-white border-ink shadow-sm'
                      : 'bg-white/70 border-ink/10 hover:border-ink/25'
                    }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {app.icon && (
                      <img src={app.icon} alt={app.name}
                        className="w-11 h-11 rounded-xl object-cover border border-ink/10 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-ink truncate">{app.name}</p>
                        {app.store && (
                          <span className="text-[10px] bg-ink/5 text-ink/40 px-1.5 py-0.5 rounded shrink-0">
                            {storeLabel(app.store)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink/45 truncate mt-0.5">{app.developer}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-xs font-semibold text-ink">★ {app.rating?.toFixed(1) ?? 'N/A'}</p>
                      <p className="text-[11px] text-ink/35 mt-0.5">{app.reviews?.toLocaleString() ?? 0}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold
                      ${isSelected ? 'bg-lime border-ink text-ink' : 'border-ink/25'}`}>
                      {isSelected && '✓'}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {error && <p className="text-red-500 text-xs mb-4">{error}</p>}

          <button
            onClick={runAnalysis}
            disabled={selectedApps.length === 0}
            className={`w-full py-4 rounded-xl font-bold text-sm transition-all font-sans border-0
              ${selectedApps.length > 0
                ? 'bg-lime text-ink hover:opacity-90 cursor-pointer shadow-sm'
                : 'bg-ink/8 text-ink/30 cursor-not-allowed'
              }`}
          >
            {selectedApps.length === 0
              ? 'Select at least 1 app'
              : `Analyse ${selectedApps.length} app${selectedApps.length > 1 ? 's' : ''} →`
            }
          </button>
        </div>
      )}

      {/* ── STEP 3: LOADING ── */}
      {step === 'analyse' && (
        <div className="text-center py-24 bg-white rounded-2xl border border-ink/10">
          <div className="w-10 h-10 border-2 border-ink/15 border-t-ink rounded-full animate-spin mx-auto mb-6" />
          <h2 className="font-serif text-2xl font-bold text-ink mb-2">Mining reviews with AI...</h2>
          <p className="text-sm text-ink/50 font-light">
            Reading {selectedApps.length} app{selectedApps.length > 1 ? 's' : ''} for complaints.
            <br />Takes about 15 seconds.
          </p>
        </div>
      )}

      {/* ── STEP 4: RESULTS ── */}
      {step === 'results' && analysis && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-white p-6 rounded-2xl border border-ink/10 shadow-sm">
            <p className="text-xs font-mono text-ink/35 mb-3">
              {selectedApps.length} apps · {reviewCount.toLocaleString()} reviews scanned ·
              {selectedApps.some(a => a.store === 'appstore') && ' 🍎'}
              {selectedApps.some(a => a.store === 'playstore') && ' 🤖'}
            </p>
            <h2 className="font-serif text-2xl font-black text-ink mb-3">
              Gaps in the "{market}" market
            </h2>
            <p className="text-sm text-ink/65 leading-relaxed font-light">{analysis.summary}</p>
          </div>

          <div className="bg-white rounded-2xl border border-ink/10 shadow-sm overflow-hidden divide-y divide-ink/[0.06]">
            {analysis.gaps.map(gap => (
              <div key={gap.rank} className="p-6 flex items-start gap-4">
                <span className="font-mono text-sm font-bold text-ink/25 w-5 pt-0.5 shrink-0">{gap.rank}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h3 className="text-[15px] font-semibold text-ink">{gap.complaint}</h3>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded
                      ${gap.opportunity === 'Critical' ? 'bg-lime text-ink'
                        : gap.opportunity === 'High' ? 'bg-ink text-paper'
                        : 'bg-ink/8 text-ink/55'}`}>
                      {gap.opportunity}
                    </span>
                  </div>
                  <p className="text-sm text-ink/55 font-light leading-relaxed">{gap.detail}</p>
                </div>
                <span className="text-xs font-mono text-ink/35 whitespace-nowrap pt-0.5 shrink-0">
                  ~{gap.mentions}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={saveReport}
              disabled={saving}
              className="flex-1 bg-ink text-paper font-bold px-6 py-3.5 rounded-xl
                text-sm hover:opacity-90 transition-all cursor-pointer border-0 font-sans disabled:opacity-50"
            >
              {saving ? 'Saving...' : '💾 Save report'}
            </button>
            <button
              onClick={copyReport}
              className="flex-1 bg-white text-ink border border-ink/15 font-bold px-6 py-3.5
                rounded-xl text-sm hover:border-ink/30 transition-all cursor-pointer font-sans"
            >
              {copied ? '✓ Copied' : 'Copy report'}
            </button>
            <button
              onClick={reset}
              className="flex-1 bg-lime text-ink border border-ink/15 font-bold px-6 py-3.5
                rounded-xl text-sm hover:opacity-90 transition-all cursor-pointer border-0 font-sans"
            >
              New search
            </button>
          </div>
        </div>
      )}
    </div>
  )
}