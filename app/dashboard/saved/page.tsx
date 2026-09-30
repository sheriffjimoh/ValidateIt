'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SavedReport } from '../type'

export default function SavedPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [reports, setReports]         = useState<SavedReport[]>([])
  const [loading, setLoading]         = useState(true)
  const [viewing, setViewing]         = useState<SavedReport | null>(null)

  const loadReports = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) setReports(data as SavedReport[])
    setLoading(false)
  }, [])

  useEffect(() => { loadReports() }, [loadReports])

  const deleteReport = async (id: string) => {
    await supabase.from('saved_searches').delete().eq('id', id)
    setReports(prev => prev.filter(r => r.id !== id))
    if (viewing?.id === id) setViewing(null)
  }

  if (loading) return (
    <div className="text-center py-24 text-sm text-ink/40">Loading reports...</div>
  )

  // ── Viewing a single report ──────────────────────────────────────────────
  if (viewing) return (
    <div className="max-w-2xl space-y-6">
      <button
        onClick={() => setViewing(null)}
        className="text-xs font-semibold text-ink/50 hover:text-ink cursor-pointer bg-transparent border-0 font-sans"
      >
        ← Back to saved
      </button>

      <div className="bg-white p-6 rounded-2xl border border-ink/10 shadow-sm">
        <p className="text-xs font-mono text-ink/35 mb-2">
          {new Date(viewing.created_at).toLocaleDateString()} · Saved report
        </p>
        <h2 className="font-serif text-2xl font-black text-ink mb-3">
          Gaps in "{viewing.market_query}"
        </h2>
        <p className="text-sm text-ink/65 font-light leading-relaxed">{viewing.analysis.summary}</p>
      </div>

      <div className="bg-white rounded-2xl border border-ink/10 shadow-sm overflow-hidden divide-y divide-ink/[0.06]">
        {viewing.analysis.gaps.map(gap => (
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
            <span className="text-xs font-mono text-ink/35 whitespace-nowrap shrink-0">~{gap.mentions}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => deleteReport(viewing.id)}
        className="text-xs text-red-400 hover:text-red-600 cursor-pointer font-medium bg-transparent border-0 font-sans"
      >
        🗑 Delete this report
      </button>
    </div>
  )

  // ── Report list ──────────────────────────────────────────────────────────
  return (
    <div>
      <h1 className="font-serif text-3xl font-black text-ink mb-2">Saved reports</h1>
      <p className="text-sm text-ink/55 font-light mb-8">Your saved market validation reports.</p>

      {reports.length === 0 ? (
        <div className="bg-white p-16 text-center rounded-2xl border border-ink/10 text-ink/40 text-sm">
          No saved reports yet.{' '}
          <a href="/dashboard" className="underline font-semibold text-ink">
            Validate a market
          </a>{' '}
          and click Save.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map(report => (
            <div
              key={report.id}
              className="bg-white p-6 rounded-2xl border border-ink/10 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-ink/35 mb-2">
                  <span>{new Date(report.created_at).toLocaleDateString()}</span>
                  <span>{report.selected_apps?.length ?? 0} apps · {report.review_count?.toLocaleString() ?? 0} reviews</span>
                </div>
                <h3 className="font-serif text-lg font-bold text-ink mb-2 capitalize">
                  {report.market_query}
                </h3>
                <p className="text-xs text-ink/55 line-clamp-2 font-light mb-4">
                  {report.analysis.summary}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewing(report)}
                  className="flex-1 bg-paper border border-ink/15 text-ink font-bold py-2.5
                    rounded-xl text-xs hover:bg-ink/5 transition-all cursor-pointer font-sans"
                >
                  View report →
                </button>
                <button
                  onClick={() => deleteReport(report.id)}
                  className="px-3 py-2.5 rounded-xl border border-red-100 text-red-400
                    hover:bg-red-50 text-xs cursor-pointer font-sans"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}