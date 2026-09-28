'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Analysis, App, Profile, SavedReport } from './type'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<'validate' | 'saved' | 'billing'>('validate')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [savedReports, setSavedReports] = useState<SavedReport[]>([])
  const [viewingSavedReport, setViewingSavedReport] = useState<SavedReport | null>(null)
  const [loadingReports, setLoadingReports] = useState(false)

  // Validator state
  const [step, setStep] = useState<'search' | 'select' | 'analyse' | 'results'>('search')
  const [market, setMarket] = useState('')
  const [apps, setApps] = useState<App[]>([])
  const [selectedApps, setSelectedApps] = useState<App[]>([])
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [reviewCount, setReviewCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // ─── Auth + Profile load ────────────────────────────────────────────────────

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) setProfile(profileData as Profile)
    }
    loadUser()
  }, [])

  // ─── Load saved reports ─────────────────────────────────────────────────────

  const loadSavedReports = useCallback(async () => {
    setLoadingReports(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) setSavedReports(data as SavedReport[])
    setLoadingReports(false)
  }, [])

  useEffect(() => {
    loadSavedReports()
  }, [loadSavedReports])

  // ─── Sign Out ───────────────────────────────────────────────────────────────

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // ─── Validator: Step 1 ─────────────────────────────────────────────────────

  const searchApps = async (e?: React.FormEvent, customMarket?: string) => {
    if (e) e.preventDefault()
    const queryTerm = customMarket || market
    if (!queryTerm.trim()) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/search-apps?q=${encodeURIComponent(queryTerm)}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setApps(data.apps)
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

  // ─── Validator: Step 2 — Run Analysis ──────────────────────────────────────

  const runAnalysis = async () => {
    if (selectedApps.length === 0) return

    // Check quota
    if (profile && profile.plan_type === 'free' && profile.credits_used >= profile.credits_limit) {
      setError('You\'ve used all your free analyses this month. Upgrade to Pro for unlimited.')
      return
    }

    setLoading(true)
    setError('')
    setStep('analyse')

    try {
      const reviewResults = await Promise.all(
        selectedApps.map(app =>
          fetch(`/api/fetch-reviews?appId=${app.id}`).then(r => r.json())
        )
      )

      const allReviews = reviewResults.flatMap(r => r.reviews || [])
      const total = reviewResults.reduce((sum, r) => sum + (r.total || 0), 0)
      setReviewCount(total)

      if (allReviews.length === 0) {
        throw new Error('No reviews found for these apps. Try selecting different ones.')
      }

      const res = await fetch('/api/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ market, apps: selectedApps, reviews: allReviews }),
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setAnalysis(data.analysis)
      setStep('results')

      // Increment credits_used in DB
      if (profile) {
        await supabase
          .from('profiles')
          .update({ credits_used: profile.credits_used + 1 })
          .eq('id', profile.id)
        setProfile(p => p ? { ...p, credits_used: p.credits_used + 1 } : p)
      }

    } catch (err: any) {
      setError(err.message || 'Analysis failed. Please try again.')
      setStep('select')
    } finally {
      setLoading(false)
    }
  }

  // ─── Save report to Supabase ────────────────────────────────────────────────

  const saveCurrentAnalysis = async () => {
    if (!analysis || !market) return
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      return
    }

    const { error: saveError } = await supabase.from('saved_searches').insert({
      user_id: user.id,
      market_query: market,
      selected_apps: selectedApps,
      review_count: reviewCount,
      analysis,
    })

    if (saveError) {
      setError('Failed to save report. Please try again.')
    } else {
      await loadSavedReports()
      setActiveTab('saved')
    }

    setSaving(false)
  }

  const deleteReport = async (id: string) => {
    await supabase.from('saved_searches').delete().eq('id', id)
    setSavedReports(prev => prev.filter(r => r.id !== id))
    if (viewingSavedReport?.id === id) setViewingSavedReport(null)
  }

  const reset = () => {
    setStep('search')
    setMarket('')
    setApps([])
    setSelectedApps([])
    setAnalysis(null)
    setError('')
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  const quotaUsed = profile?.credits_used ?? 0
  const quotaLimit = profile?.credits_limit ?? 3
  const quotaPercent = Math.min((quotaUsed / quotaLimit) * 100, 100)


  return (
    <div className="min-h-screen bg-paper text-ink font-sans flex flex-col">

      {/* ── HEADER ── */}
      <header className="border-b border-ink/10 bg-white sticky top-0 z-50">
        <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-serif text-xl font-bold tracking-tight text-ink">
              Validate<span className="text-lime">It</span>
            </Link>

            <div className="flex items-center gap-1 bg-paper p-1 rounded-xl border border-ink/10 text-xs font-semibold">
              {(['validate', 'saved', 'billing'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setViewingSavedReport(null) }}
                  className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer capitalize ${
                    activeTab === tab ? 'bg-ink text-paper shadow-sm' : 'text-ink/60 hover:text-ink'
                  }`}
                >
                  {tab === 'validate' ? '⚡ Validate' : tab === 'saved' ? `📂 Saved (${savedReports.length})` : '💳 Plan'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {profile && (
              <span className="text-xs font-mono bg-lime/30 text-ink border border-lime/60 px-2.5 py-1 rounded-md">
                {profile.plan_type === 'free' ? `Free · ${quotaUsed}/${quotaLimit} used` : 'Pro ✓'}
              </span>
            )}
            <button
              onClick={handleSignOut}
              className="text-xs font-medium text-ink/50 hover:text-ink cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </nav>
      </header>

      {/* ── MAIN ── */}
      <main className="max-w-4xl mx-auto px-6 py-10 w-full flex-1">

        {/* ─ TAB 1: VALIDATE ─ */}
        {activeTab === 'validate' && !viewingSavedReport && (
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-ink/40 mb-6 uppercase tracking-wider">
              <span>Step {step === 'search' ? '1' : step === 'select' ? '2' : '3'} of 3</span>
              {step !== 'search' && (
                <button onClick={reset} className="hover:text-ink cursor-pointer">← New Search</button>
              )}
            </div>

            {/* Step 1 — Search */}
            {step === 'search' && (
              <div>
                <h1 className="font-serif text-3xl font-black text-ink mb-3">Validate a New Idea</h1>
                <p className="text-sm text-ink/60 font-light mb-8">
                  Enter a market niche to find what users of competitor apps are begging for.
                </p>

                <form onSubmit={searchApps} className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 bg-white p-2 rounded-2xl border border-ink/20 shadow-md">
                    <input
                      type="text"
                      value={market}
                      onChange={e => setMarket(e.target.value)}
                      placeholder="e.g. habit tracker for students"
                      required
                      className="flex-1 bg-transparent text-ink px-4 py-3 text-sm focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-lime text-ink font-bold px-8 py-3 rounded-xl text-sm hover:opacity-90 transition-all cursor-pointer border border-ink/20"
                    >
                      {loading ? 'Searching...' : 'Find Competitors →'}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {['invoicing for freelancers', 'meditation for anxiety', 'language learning app'].map(ex => (
                      <button
                        key={ex}
                        type="button"
                        onClick={() => { setMarket(ex); searchApps(undefined, ex) }}
                        className="bg-white border border-ink/10 text-ink/70 hover:text-ink px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </form>

                {error && <p className="text-red-500 text-xs mt-4">{error}</p>}
              </div>
            )}

            {/* Step 2 — Select */}
            {step === 'select' && (
              <div>
                <h2 className="font-serif text-3xl font-black text-ink mb-2">Select Competitors</h2>
                <p className="text-sm text-ink/60 font-light mb-8">
                  Pick up to 5 apps for "{market}". We'll mine their 1★ and 2★ reviews.
                </p>

                <div className="space-y-3 mb-8">
                  {apps.map(app => {
                    const selected = selectedApps.find(a => a.id === app.id)
                    return (
                      <button
                        key={app.id}
                        onClick={() => toggleApp(app)}
                        className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between gap-4 cursor-pointer ${
                          selected ? 'bg-white border-ink shadow-sm' : 'bg-white/60 border-ink/10 hover:border-ink/30'
                        }`}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          {app.icon && <img src={app.icon} alt={app.name} className="w-12 h-12 rounded-xl object-cover border border-ink/10" />}
                          <div className="truncate">
                            <p className="text-sm font-semibold text-ink truncate">{app.name}</p>
                            <p className="text-xs text-ink/50 truncate mt-0.5">{app.developer}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right">
                            <p className="text-xs font-semibold text-ink">★ {app.rating?.toFixed(1)}</p>
                            <p className="text-[11px] text-ink/40 mt-0.5">{app.reviews?.toLocaleString()} reviews</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold ${
                            selected ? 'bg-lime border-ink text-ink' : 'border-ink/30'
                          }`}>
                            {selected && '✓'}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {error && <p className="text-red-500 text-xs mb-4">{error}</p>}

                <button
                  onClick={runAnalysis}
                  disabled={selectedApps.length === 0 || loading}
                  className={`w-full py-4 px-8 rounded-xl font-bold text-sm transition-all shadow-md ${
                    selectedApps.length > 0 ? 'bg-lime text-ink hover:opacity-90 cursor-pointer' : 'bg-ink/10 text-ink/40 cursor-not-allowed'
                  }`}
                >
                  {selectedApps.length === 0 ? 'Select at least 1 app' : `Analyze ${selectedApps.length} App${selectedApps.length > 1 ? 's' : ''} with Gemini →`}
                </button>
              </div>
            )}

            {/* Step 3 — Analysing */}
            {step === 'analyse' && (
              <div className="text-center py-20 bg-white rounded-2xl border border-ink/10 shadow-sm px-6">
                <div className="w-10 h-10 border-2 border-ink/20 border-t-ink rounded-full animate-spin mx-auto mb-6" />
                <h2 className="font-serif text-2xl font-bold text-ink mb-2">Mining reviews with AI...</h2>
                <p className="text-sm text-ink/60 font-light max-w-sm mx-auto">
                  Reading {selectedApps.length} app{selectedApps.length > 1 ? 's' : ''} for 1★ & 2★ complaints.
                </p>
              </div>
            )}

            {/* Step 4 — Results */}
            {step === 'results' && analysis && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-ink/10 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-ink/40 font-mono mb-3">
                    <span>{selectedApps.length} apps · {reviewCount.toLocaleString()} reviews scanned</span>
                  </div>
                  <h2 className="font-serif text-2xl font-black text-ink mb-3">Market Gaps in "{market}"</h2>
                  <p className="text-sm text-ink/70 leading-relaxed font-light">{analysis.summary}</p>
                </div>

                <div className="bg-white rounded-2xl border border-ink/10 shadow-sm overflow-hidden divide-y divide-ink/5">
                  {analysis.gaps.map(gap => (
                    <div key={gap.rank} className="p-6 flex items-start gap-4 hover:bg-ink/[0.01] transition-colors">
                      <span className="font-mono text-sm font-bold text-ink/30 w-6 pt-0.5">{gap.rank}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                          <h3 className="text-base font-semibold text-ink">{gap.complaint}</h3>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            gap.opportunity === 'Critical' ? 'bg-lime text-ink border border-ink/20' :
                            gap.opportunity === 'High' ? 'bg-ink text-paper' : 'bg-ink/10 text-ink/60'
                          }`}>
                            {gap.opportunity}
                          </span>
                        </div>
                        <p className="text-sm text-ink/60 leading-relaxed font-light">{gap.detail}</p>
                      </div>
                      <span className="text-xs font-mono text-ink/50 whitespace-nowrap pt-1">~{gap.mentions}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={saveCurrentAnalysis}
                    disabled={saving}
                    className="flex-1 bg-ink text-paper font-bold px-6 py-3.5 rounded-xl text-sm hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : '💾 Save to Dashboard'}
                  </button>
                  <button
                    onClick={reset}
                    className="flex-1 bg-lime text-ink border border-ink/20 font-bold px-6 py-3.5 rounded-xl text-sm hover:opacity-90 transition-all cursor-pointer"
                  >
                    Validate Another Market
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─ TAB 2: SAVED ─ */}
        {(activeTab === 'saved' || viewingSavedReport) && (
          <div>
            {viewingSavedReport ? (
              <div className="space-y-6">
                <button
                  onClick={() => setViewingSavedReport(null)}
                  className="text-xs font-semibold text-ink/60 hover:text-ink cursor-pointer mb-2"
                >
                  ← Back to Saved Searches
                </button>

                <div className="bg-white p-6 rounded-2xl border border-ink/10 shadow-sm">
                  <span className="text-xs font-mono text-ink/40">
                    {new Date(viewingSavedReport.created_at).toLocaleDateString()} · Saved Report
                  </span>
                  <h2 className="font-serif text-2xl font-black text-ink mt-1 mb-3">
                    Gaps in "{viewingSavedReport.market_query}"
                  </h2>
                  <p className="text-sm text-ink/70 leading-relaxed font-light">
                    {viewingSavedReport.analysis.summary}
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-ink/10 shadow-sm overflow-hidden divide-y divide-ink/5">
                  {viewingSavedReport.analysis.gaps.map(gap => (
                    <div key={gap.rank} className="p-6 flex items-start gap-4">
                      <span className="font-mono text-sm font-bold text-ink/30 w-6 pt-0.5">{gap.rank}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <h3 className="text-base font-semibold text-ink">{gap.complaint}</h3>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            gap.opportunity === 'Critical' ? 'bg-lime text-ink border border-ink/20' :
                            gap.opportunity === 'High' ? 'bg-ink text-paper' : 'bg-ink/10 text-ink/60'
                          }`}>
                            {gap.opportunity}
                          </span>
                        </div>
                        <p className="text-sm text-ink/60 font-light">{gap.detail}</p>
                      </div>
                      <span className="text-xs font-mono text-ink/50">~{gap.mentions}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => deleteReport(viewingSavedReport.id)}
                  className="text-xs text-red-400 hover:text-red-600 cursor-pointer font-medium"
                >
                  🗑 Delete this report
                </button>
              </div>
            ) : (
              <div>
                <h1 className="font-serif text-3xl font-black text-ink mb-3">Saved Searches</h1>
                <p className="text-sm text-ink/60 font-light mb-8">Your saved market validation reports.</p>

                {loadingReports ? (
                  <div className="text-center py-20 text-sm text-ink/40">Loading reports...</div>
                ) : savedReports.length === 0 ? (
                  <div className="bg-white p-12 text-center rounded-2xl border border-ink/10 text-ink/40 text-sm">
                    No saved reports yet.{' '}
                    <button onClick={() => setActiveTab('validate')} className="underline font-semibold text-ink cursor-pointer">
                      Validate a market
                    </button>{' '}
                    and click Save.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {savedReports.map(report => (
                      <div
                        key={report.id}
                        className="bg-white p-6 rounded-2xl border border-ink/10 shadow-sm flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs font-mono text-ink/40 mb-2">
                            <span>{new Date(report.created_at).toLocaleDateString()}</span>
                            <span>{report.selected_apps?.length ?? 0} apps · {report.review_count?.toLocaleString() ?? 0} reviews</span>
                          </div>
                          <h3 className="font-serif text-xl font-bold text-ink mb-2 capitalize">{report.market_query}</h3>
                          <p className="text-xs text-ink/60 line-clamp-2 font-light mb-4">
                            {report.analysis.summary}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setViewingSavedReport(report)}
                            className="flex-1 bg-paper border border-ink/20 text-ink font-bold py-2.5 rounded-xl text-xs hover:bg-ink/5 transition-all cursor-pointer text-center"
                          >
                            View Report →
                          </button>
                          <button
                            onClick={() => deleteReport(report.id)}
                            className="px-3 py-2.5 rounded-xl border border-red-100 text-red-400 hover:bg-red-50 text-xs cursor-pointer"
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─ TAB 3: BILLING ─ */}
        {activeTab === 'billing' && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="bg-white p-8 rounded-2xl border border-ink/10 shadow-sm">
              <span className="text-xs font-mono uppercase font-bold text-ink/40">Current Plan</span>
              <h2 className="font-serif text-3xl font-black text-ink mt-1 mb-6 capitalize">
                {profile?.plan_type === 'pro' ? 'Pro' : 'Starter (Free)'}
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-xs font-mono">
                  <span>Monthly Analyses</span>
                  <span className="font-bold">{quotaUsed} / {quotaLimit} used</span>
                </div>
                <div className="w-full bg-paper h-2 rounded-full overflow-hidden border border-ink/10">
                  <div
                    className="bg-lime h-full rounded-full transition-all"
                    style={{ width: `${quotaPercent}%` }}
                  />
                </div>
              </div>

              {profile?.plan_type !== 'pro' && (
                <Link
                  href="/pricing"
                  className="block text-center w-full bg-lime text-ink font-bold py-3.5 rounded-xl text-sm hover:opacity-90 transition-all shadow-md border border-ink/20"
                >
                  Upgrade to Pro (₦15,000/mo) →
                </Link>
              )}
            </div>

            {profile?.email && (
              <div className="bg-white p-6 rounded-2xl border border-ink/10">
                <p className="text-xs font-mono text-ink/40 mb-1">Account</p>
                <p className="text-sm font-medium text-ink">{profile.email}</p>
              </div>
            )}
          </div>
        )}

      </main>

      <footer className="border-t border-ink/10 py-5 text-center text-xs text-ink/40 bg-paper">
        © 2026 ValidateIt
      </footer>
    </div>
  )
}
