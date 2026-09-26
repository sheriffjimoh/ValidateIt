'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

type App = {
  id: number
  name: string
  developer: string
  rating: number
  reviews: number
  icon: string
}

type Gap = {
  rank: number
  complaint: string
  detail: string
  mentions: number
  opportunity: 'Critical' | 'High' | 'Medium'
}

type Analysis = {
  summary: string
  gaps: Gap[]
}

type Step = 'search' | 'select' | 'analyse' | 'results'

function ToolContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''

  const [step, setStep]           = useState<Step>('search')
  const [market, setMarket]       = useState(initialQuery)
  const [apps, setApps]           = useState<App[]>([])
  const [selectedApps, setSelectedApps] = useState<App[]>([])
  const [analysis, setAnalysis]   = useState<Analysis | null>(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [reviewCount, setReviewCount] = useState(0)

  const performSearch = async (queryTerm: string) => {
    if (!queryTerm.trim()) return
    setLoading(true)
    setError('')

    try {
      const res  = await fetch(`/api/search-apps?q=${encodeURIComponent(queryTerm)}`)
      const data = await res.json()

      if (data.error) throw new Error(data.error)

      setApps(data.apps)
      setStep('select')
    } catch (err) {
      setError('Could not find apps. Try a different search term.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialQuery.trim() && step === 'search' && apps.length === 0) {
      performSearch(initialQuery)
    }
  }, [initialQuery])

  // Step 1 — Search for apps form submit
  const searchApps = async (e: React.FormEvent) => {
    e.preventDefault()
    performSearch(market)
  }

  // Step 2 — Toggle app selection
  const toggleApp = (app: App) => {
    setSelectedApps(prev =>
      prev.find(a => a.id === app.id)
        ? prev.filter(a => a.id !== app.id)
        : prev.length < 5 ? [...prev, app] : prev
    )
  }

  // Step 3 — Fetch reviews and analyse
  const runAnalysis = async () => {
    if (selectedApps.length === 0) return
    setLoading(true)
    setError('')
    setStep('analyse')

    try {
      const reviewResults = await Promise.all(
        selectedApps.map(app =>
          fetch(`/api/fetch-reviews?appId=${app.id}`)
            .then(r => r.json())
        )
      )

      const allReviews = reviewResults.flatMap(r => r.reviews || [])
      const total      = reviewResults.reduce((sum, r) => sum + (r.total || 0), 0)
      setReviewCount(total)

      if (allReviews.length === 0) {
        throw new Error('No reviews found for these apps. Try selecting different ones.')
      }

      const res = await fetch('/api/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market,
          apps: selectedApps,
          reviews: allReviews,
        }),
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setAnalysis(data.analysis)
      setStep('results')

    } catch (err: any) {
      setError(err.message || 'Analysis failed. Please try again.')
      setStep('select')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setStep('search')
    setMarket('')
    setApps([])
    setSelectedApps([])
    setAnalysis(null)
    setError('')
  }

  return (
    <main className="min-h-screen bg-paper text-ink font-sans">
      {/* Top Header Nav */}
      <header className="border-b border-ink/10 bg-paper/90 backdrop-blur-sm sticky top-0 z-50">
        <nav className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-serif text-lg font-bold text-ink flex items-center gap-2">
            <span className="bg-ink text-lime px-2 py-0.5 rounded text-xs font-mono font-bold">V</span>
            ValidateIt
          </Link>

          {step !== 'search' && (
            <button
              onClick={reset}
              className="text-xs font-semibold text-ink/60 hover:text-ink transition-colors cursor-pointer"
            >
              ← Start over
            </button>
          )}
        </nav>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Step Indicator */}
        <div className="flex items-center gap-2 text-xs font-mono text-ink/40 mb-6 uppercase tracking-wider">
          <span>Step {step === 'search' ? '1' : step === 'select' ? '2' : step === 'analyse' ? '3' : '3'} of 3</span>
        </div>

        {/* Step 1 — Search */}
        {step === 'search' && (
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-black text-ink tracking-tight leading-tight mb-3">
              What market are you building in?
            </h1>
            <p className="text-sm sm:text-base text-ink/60 font-light mb-8">
              Be specific for the best results — e.g. <span className="font-medium text-ink font-mono">"invoicing app for freelancers"</span> works better than <span className="font-mono text-ink/40">"finance app"</span>.
            </p>

            <form onSubmit={searchApps} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-0">
                <input
                  type="text"
                  value={market}
                  onChange={(e) => setMarket(e.target.value)}
                  placeholder="e.g. habit tracker for students"
                  required
                  className="flex-1 bg-white border border-ink/20 text-ink px-5 py-3.5 text-sm rounded-xl sm:rounded-r-none focus:outline-none focus:border-ink shadow-sm"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-lime text-ink border border-ink/20 sm:border-l-0 px-8 py-3.5 text-sm font-bold rounded-xl sm:rounded-l-none hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Searching...' : 'Find Competitors →'}
                </button>
              </div>

              {/* Suggestions */}
              <div>
                <p className="text-xs text-ink/40 mb-2 font-mono">Popular searches:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'invoicing for freelancers',
                    'meditation for anxiety',
                    'project management for agencies',
                    'language learning app',
                  ].map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => {
                        setMarket(example)
                        performSearch(example)
                      }}
                      className="bg-white border border-ink/10 text-ink/70 hover:text-ink hover:border-ink/30 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </form>

            {error && (
              <p className="text-red-500 text-xs mt-4 font-medium">{error}</p>
            )}
          </div>
        )}

        {/* Step 2 — Select apps */}
        {step === 'select' && (
          <div>
            <h2 className="font-serif text-3xl font-black text-ink mb-2">
              Select competitor apps
            </h2>
            <p className="text-sm text-ink/60 font-light mb-8">
              Pick up to 5 competing apps. ValidateIt will read their 1-star and 2-star reviews.
            </p>

            <div className="space-y-3 mb-8">
              {apps.map((app) => {
                const isSelected = selectedApps.find(a => a.id === app.id)
                return (
                  <button
                    key={app.id}
                    onClick={() => toggleApp(app)}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between gap-4 cursor-pointer ${
                      isSelected
                        ? 'bg-white border-ink shadow-sm'
                        : 'bg-white/60 border-ink/10 hover:border-ink/30 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {app.icon && (
                        <img
                          src={app.icon}
                          alt={app.name}
                          className="w-12 h-12 rounded-xl object-cover border border-ink/10 shrink-0"
                        />
                      )}
                      <div className="truncate">
                        <p className="text-sm font-semibold text-ink truncate">{app.name}</p>
                        <p className="text-xs text-ink/50 truncate mt-0.5">{app.developer}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0">
                      <div className="text-right">
                        <p className="text-xs font-semibold text-ink">★ {app.rating?.toFixed(1) || 'N/A'}</p>
                        <p className="text-[11px] text-ink/40 mt-0.5">{app.reviews?.toLocaleString() || 0} reviews</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold transition-all ${
                        isSelected ? 'bg-lime border-ink text-ink' : 'border-ink/30 bg-transparent'
                      }`}>
                        {isSelected && '✓'}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {error && (
              <p className="text-red-500 text-xs mb-4 font-medium">{error}</p>
            )}

            <button
              onClick={runAnalysis}
              disabled={selectedApps.length === 0 || loading}
              className={`w-full py-4 px-8 rounded-xl font-bold text-sm transition-all shadow-md ${
                selectedApps.length > 0
                  ? 'bg-lime text-ink hover:opacity-90 active:scale-[0.99] cursor-pointer'
                  : 'bg-ink/10 text-ink/40 cursor-not-allowed'
              }`}
            >
              {selectedApps.length === 0
                ? 'Select at least one app to analyze'
                : `Analyze ${selectedApps.length} App${selectedApps.length > 1 ? 's' : ''} with Gemini AI →`
              }
            </button>
          </div>
        )}

        {/* Step 3 — Loading */}
        {step === 'analyse' && (
          <div className="text-center py-20 bg-white rounded-2xl border border-ink/10 shadow-sm px-6">
            <div className="w-10 h-10 border-2 border-ink/20 border-t-ink rounded-full animate-spin mx-auto mb-6" />
            <h2 className="font-serif text-2xl font-bold text-ink mb-2">
              Reading low-rating reviews...
            </h2>
            <p className="text-sm text-ink/60 font-light max-w-sm mx-auto">
              Mining 1 & 2-star reviews from {selectedApps.length} app{selectedApps.length > 1 ? 's' : ''} and extracting core market gaps.
            </p>
          </div>
        )}

        {/* Step 4 — Results */}
        {step === 'results' && analysis && (
          <div className="space-y-8">
            {/* Header info */}
            <div className="bg-white p-6 rounded-2xl border border-ink/10 shadow-sm">
              <div className="flex items-center justify-between text-xs text-ink/40 font-mono mb-3">
                <span>{selectedApps.length} Apps Analyzed</span>
                <span>{reviewCount.toLocaleString()} Total Reviews Scanned</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-black text-ink mb-3">
                Market Gaps in "{market}"
              </h2>
              <p className="text-sm text-ink/70 leading-relaxed font-light">
                {analysis.summary}
              </p>
            </div>

            {/* Gap cards */}
            <div className="bg-white rounded-2xl border border-ink/10 shadow-sm overflow-hidden divide-y divide-ink/5">
              {analysis.gaps.map((gap) => (
                <div key={gap.rank} className="p-6 flex items-start gap-4 hover:bg-ink/[0.01] transition-colors">
                  <span className="font-mono text-sm font-bold text-ink/30 w-6 pt-0.5">{gap.rank}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                      <h3 className="text-base font-semibold text-ink">{gap.complaint}</h3>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        gap.opportunity === 'Critical'
                          ? 'bg-lime text-ink border border-ink/20'
                          : gap.opportunity === 'High'
                          ? 'bg-ink text-paper'
                          : 'bg-ink/10 text-ink/60'
                      }`}>
                        {gap.opportunity} Opportunity
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-ink/60 leading-relaxed font-light">{gap.detail}</p>
                  </div>
                  <span className="text-xs font-mono text-ink/50 whitespace-nowrap pt-1">
                    ~{gap.mentions} mentions
                  </span>
                </div>
              ))}
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
              <button
                onClick={reset}
                className="w-full sm:w-auto bg-lime text-ink border border-ink/20 font-bold px-6 py-3.5 rounded-xl text-sm hover:opacity-90 transition-all cursor-pointer"
              >
                Analyze Another Market
              </button>
              <button
                onClick={() => {
                  const text = analysis.gaps
                    .map(g => `${g.rank}. ${g.complaint} (~${g.mentions} mentions) — ${g.opportunity}`)
                    .join('\n')
                  navigator.clipboard.writeText(`Gaps in the "${market}" market:\n\n${text}`)
                }}
                className="w-full sm:w-auto border border-ink/20 bg-white text-ink font-semibold px-6 py-3.5 rounded-xl text-sm hover:bg-ink/5 transition-all cursor-pointer"
              >
                📋 Copy Report to Clipboard
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default function ToolPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ink border-t-lime rounded-full animate-spin" />
      </div>
    }>
      <ToolContent />
    </Suspense>
  )
}