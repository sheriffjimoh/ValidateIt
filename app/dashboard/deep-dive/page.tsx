'use client'

import { useState } from 'react'
import { useEffect } from 'react'
import Link from 'next/link'
import { jsPDF } from 'jspdf'
import { createClient } from '@/lib/supabase/client'
import { isActivePro } from '@/lib/utils'
import type { Profile } from '../type'

type AppResult = {
  id: string
  name: string
  developer: string
  rating: number
  reviews: number
  icon: string
  store: string
}

type Complaint = {
  rank: number
  complaint: string
  detail: string
  mentions: number
  severity: 'Critical' | 'High' | 'Medium'
}

type Opportunity = {
  title: string
  description: string
}

type Analysis = {
  appName: string
  summary: string
  topComplaints: Complaint[]
  opportunities: Opportunity[]
}

type Step = 'search' | 'select' | 'analyse' | 'results'

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error(`The server returned an unexpected response (${response.status}). Please try again.`)
  }

  const data = await response.json() as T & { error?: string }
  if (!response.ok || data.error) throw new Error(data.error || `Request failed (${response.status}).`)
  return data
}

export default function DeepDivePage() {
  const [step, setStep]         = useState<Step>('search')
  const [query, setQuery]       = useState('')
  const [store, setStore]       = useState<'appstore' | 'playstore'>('appstore')
  const [apps, setApps]         = useState<AppResult[]>([])
  const [selected, setSelected] = useState<AppResult | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [supabase] = useState(() => createClient())
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  const hasActivePro = isActivePro(profile)
  const deepDiveLimit = hasActivePro ? 99 : (profile?.deep_dive_limit ?? 2)
  const deepDiveUsed = profile?.deep_dive_used ?? 0
  const freeDeepDivesRemaining = Math.max(deepDiveLimit - deepDiveUsed, 0)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (data) setProfile(data as Profile)
      } finally {
        setProfileLoading(false)
      }
    }
    loadProfile()
  }, [supabase])

  const searchApps = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError('')

    try {
      const endpoint = store === 'appstore'
        ? `/api/search-apps?q=${encodeURIComponent(query)}`
        : `/api/search-playstore?q=${encodeURIComponent(query)}`

      const data = await requestJson<{ apps: AppResult[] }>(endpoint)
      setApps(data.apps)
      setStep('select')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not find apps. Try a different search term.')
    } finally {
      setLoading(false)
    }
  }

  const runDeepDive = async (app: AppResult) => {
    if (profileLoading) return
    if (!hasActivePro && freeDeepDivesRemaining <= 0) {
      setError('You have used your free Deep Dive analyses. Upgrade to Pro for unlimited Deep Dives.')
      return
    }

    setSelected(app)
    setLoading(true)
    setError('')
    setStep('analyse')

    try {
      // Fetch reviews
      const endpoint = store === 'appstore'
        ? `/api/fetch-reviews?appId=${app.id}`
        : `/api/fetch-playstore?appId=${app.id}`

      const reviewData = await requestJson<{ reviews?: Array<{ rating: string | number; title?: string; content?: string }> }>(endpoint)
      const reviews    = reviewData.reviews || []

      if (reviews.length === 0) {
        throw new Error('No reviews found for this app.')
      }

      // Run deep dive analysis
      const data = await requestJson<{ analysis: Analysis; deepDiveUsed?: number; deepDiveLimit?: number }>('/api/deep-dive', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          appName: app.name,
          appId:   app.id,
          store,
          reviews,
        }),
      })

      setAnalysis(data.analysis)
      if (!hasActivePro && typeof data.deepDiveUsed === 'number') {
        setProfile(current => current ? {
          ...current,
          deep_dive_used: data.deepDiveUsed,
          deep_dive_limit: data.deepDiveLimit ?? current.deep_dive_limit,
        } : current)
      }
      setStep('results')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analysis failed.')
      setStep('select')
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = () => {
    if (!analysis || !hasActivePro) return
    const doc = new jsPDF()

    // Title
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text(`Deep Dive: ${analysis.appName}`, 20, 20)

    // Summary
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text('Summary', 20, 35)
    doc.setFontSize(10)
    const summaryLines = doc.splitTextToSize(analysis.summary, 170)
    doc.text(summaryLines, 20, 42)

    // Top Complaints
    let y = 42 + summaryLines.length * 6 + 10
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Top Complaints', 20, y)
    y += 8

    analysis.topComplaints.forEach((c) => {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(`${c.rank}. ${c.complaint} [${c.severity}] (~${c.mentions})`, 20, y)
      y += 6
      doc.setFont('helvetica', 'normal')
      const lines = doc.splitTextToSize(c.detail, 170)
      doc.text(lines, 20, y)
      y += lines.length * 6 + 4
    })

    // Opportunities
    y += 6
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Opportunities', 20, y)
    y += 8

    analysis.opportunities.forEach((o, i) => {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(`${i + 1}. ${o.title}`, 20, y)
      y += 6
      doc.setFont('helvetica', 'normal')
      const lines = doc.splitTextToSize(o.description, 170)
      doc.text(lines, 20, y)
      y += lines.length * 6 + 4
    })

    doc.save(`deep-dive-${analysis.appName.toLowerCase().replace(/\s/g, '-')}.pdf`)
  }

  const reset = () => {
    setStep('search')
    setQuery('')
    setApps([])
    setSelected(null)
    setAnalysis(null)
    setError('')
  }

  const severityStyle = (s: string) => {
    if (s === 'Critical') return 'bg-lime text-ink'
    if (s === 'High')     return 'bg-ink/10 text-ink/60'
    return                       'bg-ink/5 text-ink/40'
  }

  return (
    <main className="min-h-screen bg-paper font-sans text-ink">
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

     

      <div className="max-w-3xl mx-auto px-6 sm:px-8 py-12">

        {/* Step 1 — Search */}
        {step === 'search' && (
          <div className="min-w-0 max-w-xl">
            <p className="text-[12px] text-ink/30 uppercase tracking-widest font-mono mb-6">
              Competitor Deep Dive
            </p>
            <h1 className="font-serif text-[34px] font-black tracking-tight
              leading-tight text-ink mb-3">
              Analyse one specific app.
            </h1>
            <p className="text-[15px] text-ink/50 font-light mb-10">
              Search for a competitor app. We read all their worst reviews
              and tell you exactly where they&apos;re failing.
            </p>

            {/* Store toggle */}
            <div className="flex gap-2 mb-6">
              {(['appstore', 'playstore'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStore(s)}
                  className={`px-4 py-2 text-[13px] font-medium rounded-lg border
                    cursor-pointer font-sans transition-all
                    ${store === s
                      ? 'bg-ink text-paper border-ink'
                      : 'bg-transparent text-ink/50 border-ink/15 hover:border-ink/30'
                    }`}
                >
                  {s === 'appstore' ? '🍎 App Store' : '🤖 Play Store'}
                </button>
              ))}
            </div>

            <form onSubmit={searchApps}>
              <div className="flex mb-4">
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="e.g. FreshBooks, Asana, Headspace"
                  required
                  className="flex-1 bg-white border border-ink/15 border-r-0
                    text-ink placeholder-ink/30 px-4 py-4 text-[15px]
                    rounded-l-lg font-sans focus:outline-none focus:border-ink/40"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-ink text-paper px-6 text-[14px] font-bold
                    rounded-r-lg border-0 cursor-pointer font-sans
                    hover:opacity-80 transition-opacity disabled:opacity-40"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </form>

            {error && <p className="text-red-500 text-[13px] mt-4">{error}</p>}
          </div>
        )}

        {/* Step 2 — Select one app */}
        {step === 'select' && (
          <div className="min-w-0 max-w-xl">
            <button
              onClick={() => { setStep('search'); setError('') }}
              className="mb-5 text-sm font-semibold text-ink/55 hover:text-ink bg-transparent border-0 cursor-pointer"
            >
              ← Back to search
            </button>
            <p className="text-[12px] text-ink/30 uppercase tracking-widest font-mono mb-6">
              Select the app to analyse
            </p>
            <h2 className="font-serif text-[30px] font-black tracking-tight text-ink mb-2">
              Pick your target
            </h2>
            <p className="text-[14px] text-ink/50 font-light mb-8">
              We&apos;ll read all their 1 and 2 star reviews and find every weakness.
            </p>
            <p className="text-sm text-ink/55 mb-6">
              {profileLoading
                ? 'Checking your plan...'
                : hasActivePro
                  ? 'Pro includes unlimited Deep Dives.'
                  : `${freeDeepDivesRemaining} of ${deepDiveLimit} free Deep Dives remaining.`}
            </p>
            {!profileLoading && !hasActivePro && freeDeepDivesRemaining <= 0 && (
              <p className="text-sm text-ink/60 mb-6">
                Free Deep Dives are used up. <Link href="/dashboard/plan" className="font-semibold underline underline-offset-4">Upgrade to Pro</Link> for unlimited analyses.
              </p>
            )}

            <div className="flex flex-col gap-2">
              {apps.map(app => (
                <button
                  key={app.id}
                  onClick={() => runDeepDive(app)}
                  disabled={profileLoading || loading || (!hasActivePro && freeDeepDivesRemaining <= 0)}
                  className="flex items-center gap-4 p-4 rounded-xl border
                    border-ink/8 bg-white text-left w-full cursor-pointer
                    font-sans hover:border-ink/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {app.icon && (
                    <img src={app.icon} alt={app.name}
                      className="w-10 h-10 rounded-lg shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-ink truncate">{app.name}</p>
                    <p className="text-[12px] text-ink/40 mt-0.5 truncate">{app.developer}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[12px] text-ink/50">★ {app.rating?.toFixed(1) || 'N/A'}</p>
                    <p className="text-[11px] text-ink/30 mt-0.5">
                      {app.reviews?.toLocaleString() || 0}
                    </p>
                  </div>
                  <span className="text-ink/20 text-[18px] shrink-0">→</span>
                </button>
              ))}
            </div>

            {error && <p className="text-red-500 text-[13px] mt-4">{error}</p>}
          </div>
        )}

        {/* Step 3 — Loading */}
        {step === 'analyse' && (
          <div className="text-center py-20">
            <div style={{
              width: '36px', height: '36px',
              border: '2px solid #11111115',
              borderTop: '2px solid #111111',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 28px',
            }} />
            <h2 className="font-serif text-[24px] font-bold text-ink mb-3">
              Analysing {selected?.name}...
            </h2>
            <p className="text-[14px] text-ink/40 font-light">
              Reading their worst reviews and finding every weakness.
              <br />Takes about 15 seconds.
            </p>
          </div>
        )}

        {/* Step 4 — Results */}
        {step === 'results' && analysis && (
          <div className="min-w-0 max-w-xl">

            {/* Header */}
            <div className="mb-10">
              <p className="text-[12px] text-ink/30 font-mono mb-4 uppercase tracking-widest">
                Deep dive report
              </p>
              <h2 className="result-text-wrap min-w-0 font-serif text-[30px] font-black tracking-tight
                leading-tight text-ink mb-4">
                {analysis.appName}
              </h2>
              <p className="result-text-wrap min-w-0 text-[15px] text-ink/55 font-light leading-relaxed">
                {analysis.summary}
              </p>
            </div>

            {/* Top complaints */}
            <div className="mb-12">
              <p className="text-[11px] text-ink/30 uppercase tracking-widest
                font-mono mb-6">
                Top complaints
              </p>
              <div className="min-w-0 divide-y divide-ink/[0.07]">
                {analysis.topComplaints.map(c => (
                  <div key={c.rank} className="min-w-0 py-5 grid grid-cols-[1rem_minmax(0,1fr)] sm:grid-cols-[1rem_minmax(0,1fr)_auto] gap-x-3 sm:gap-x-5 gap-y-2 items-start">
                    <span className="text-[11px] text-ink/20 font-mono pt-0.5 w-4 shrink-0">
                      {c.rank}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <p className="result-text-wrap min-w-0 text-[15px] font-medium text-ink">{c.complaint}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded
                          ${severityStyle(c.severity)}`}>
                          {c.severity}
                        </span>
                      </div>
                      <p className="result-text-wrap min-w-0 text-[13px] text-ink/40 font-light leading-relaxed">
                        {c.detail}
                      </p>
                    </div>
                    <span className="col-span-2 justify-self-end sm:col-span-1 text-[11px] text-ink/25 font-mono whitespace-nowrap pt-0.5">
                      ~{c.mentions}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Opportunities */}
            <div className="mb-10">
              <p className="text-[11px] text-ink/30 uppercase tracking-widest
                font-mono mb-6">
                How to beat them
              </p>
              <div className="flex flex-col gap-4">
                {analysis.opportunities.map((o, i) => (
                  <div key={i} className="min-w-0 max-w-full bg-white border border-ink/10 rounded-xl p-4 sm:p-5">
                    <p className="result-text-wrap min-w-0 text-[14px] font-semibold text-ink mb-1">
                      {o.title}
                    </p>
                    <p className="result-text-wrap min-w-0 text-[13px] text-ink/50 font-light leading-relaxed">
                      {o.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => { setStep('select'); setError('') }}
                className="bg-transparent text-ink/50 border border-ink/15
                  px-6 py-3.5 text-[14px] rounded-lg cursor-pointer font-sans
                  hover:border-ink/30 hover:text-ink/70 transition-all"
              >
                ← Back to apps
              </button>
              <button
                onClick={reset}
                className="bg-lime text-ink px-6 py-3.5 text-[14px] font-bold
                  rounded-lg border-0 cursor-pointer font-sans hover:opacity-90"
              >
                Analyse another app
              </button>
              {hasActivePro ? (
                <button
                  onClick={downloadPDF}
                  className="bg-transparent text-ink/50 border border-ink/15
                    px-6 py-3.5 text-[14px] rounded-lg cursor-pointer font-sans
                    hover:border-ink/30 hover:text-ink/70 transition-all"
                >
                  ↓ Download PDF
                </button>
              ) : (
                <Link
                  href="/dashboard/plan"
                  className="bg-transparent text-ink/50 border border-ink/15
                    px-6 py-3.5 text-[14px] rounded-lg no-underline font-sans
                    hover:border-ink/30 hover:text-ink/70 transition-all"
                >
                  Upgrade to Pro for PDF export
                </Link>
              )}
              <Link
                href="/tool"
                className="bg-transparent text-ink/50 border border-ink/15
                  px-6 py-3.5 text-[14px] rounded-lg no-underline font-sans
                  hover:border-ink/30 hover:text-ink/70 transition-all"
              >
                Market gap analysis →
              </Link>
            </div>

          </div>
        )}
      </div>
    </main>
  )
}