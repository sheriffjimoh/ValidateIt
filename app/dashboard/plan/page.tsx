'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { pricing } from '@/lib/pricing'
import { isActivePro } from '@/lib/utils'
import { Profile } from '../type'

type SubscriptionDetails = {
  status: string
  amount: number | null
  currency: string
  planName: string | null
  interval: string | null
  createdAt: string | null
  nextPaymentDate: string | null
  accessUntil: string | null
}

export default function PlanPage() {
  const router   = useRouter()
  const [supabase] = useState(() => createClient())
  const [profile, setProfile]     = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails | null>(null)
  const [subscriptionDetailsLoading, setSubscriptionDetailsLoading] = useState(false)
  const [subscriptionDetailsError, setSubscriptionDetailsError] = useState('')
  const [accountEmail, setAccountEmail] = useState('')
  const [loading, setLoading]     = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [accountError, setAccountError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }
        setAccountEmail(user.email ?? '')
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (data) setProfile(data as Profile)
      } finally {
        setProfileLoading(false)
      }
    }
    load()
  }, [router, supabase])

  useEffect(() => {
    if (!isActivePro(profile)) return

    const loadSubscriptionDetails = async () => {
      setSubscriptionDetailsLoading(true)
      setSubscriptionDetailsError('')
      try {
        const response = await fetch('/api/subscription-details', { cache: 'no-store' })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Could not load billing details')
        setSubscriptionDetails(data as SubscriptionDetails)
      } catch (error) {
        setSubscriptionDetailsError(error instanceof Error ? error.message : 'Could not load billing details')
      } finally {
        setSubscriptionDetailsLoading(false)
      }
    }

    loadSubscriptionDetails()
  }, [profile])

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

  const handleCancel = async () => {
    if (!window.confirm('Cancel your subscription? Pro access will remain until the end of your paid period, and you will not be charged again.')) return
    setCancelling(true)
    setAccountError('')
    try {
      const response = await fetch('/api/cancel-subscription', { method: 'POST' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not cancel subscription')
      setProfile(current => current ? { ...current, subscription_status: 'cancelled' } : current)
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : 'Could not cancel subscription')
    } finally {
      setCancelling(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm('Permanently delete your account and saved reports? This cannot be undone. Any recurring subscription will be cancelled first.')) return
    setDeleting(true)
    setAccountError('')
    try {
      const response = await fetch('/api/delete-account', { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not delete account')
      await supabase.auth.signOut()
      router.replace('/')
      router.refresh()
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : 'Could not delete account')
      setDeleting(false)
    }
  }

  const quotaUsed    = profile?.credits_used    ?? 0
  const quotaLimit   = profile?.credits_limit   ?? 3
  const quotaPercent = Math.min((quotaUsed / quotaLimit) * 100, 100)
  const ddUsed       = profile?.deep_dive_used  ?? 0
  const ddLimit      = profile?.deep_dive_limit ?? 2
  const hasActivePlan = isActivePro(profile)
  const normalizedBillingStatus = subscriptionDetails?.status.toLowerCase().replace(/[_ ]/g, '-')
  const isNonRenewing = normalizedBillingStatus === 'non-renewing' || normalizedBillingStatus === 'nonrenewing'
  const unavailableLabel = subscriptionDetailsLoading ? 'Loading...' : 'Unavailable'
  const formatDate = (date: string | null | undefined) => date
    ? new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-black text-ink mb-2">Your plan</h1>
        <p className="text-sm text-ink/55 font-light">Manage your subscription and usage.</p>
      </div>

      {profileLoading ? (
        <div className="bg-white p-8 rounded-2xl border border-ink/10 shadow-sm" role="status" aria-live="polite">
          <p className="text-sm font-medium text-ink/55">Loading your plan...</p>
          <div className="mt-5 h-4 w-32 rounded bg-ink/5 animate-pulse" />
          <div className="mt-4 h-10 w-full rounded bg-ink/5 animate-pulse" />
        </div>
      ) : (
      <>
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
          <div className="space-y-3 text-center">
            <p className="text-sm text-ink/60 font-light">
              {profile?.subscription_status === 'cancelled'
                ? `Your subscription is cancelled. Pro access remains until ${profile.subscription_expires_at ? new Date(profile.subscription_expires_at).toLocaleDateString() : 'the end of your paid period'}.`
                : profile?.subscription_status === 'past_due'
                  ? 'Your payment needs attention. Pro access remains available through your current paid period.'
                  : "You're on Pro. Thank you for subscribing."}
            </p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-ink/10 pt-4 text-left text-xs">
              <dt className="text-ink/45">Billing status</dt>
              <dd className="text-right font-semibold text-ink">
                {isNonRenewing ? 'Non-renewing' : subscriptionDetails?.status || unavailableLabel}
              </dd>
              <dt className="text-ink/45">Plan</dt>
              <dd className="text-right font-semibold text-ink">
                {subscriptionDetails?.planName || 'ValidateIt Pro'}
                {subscriptionDetails?.interval ? ` · ${subscriptionDetails.interval}` : ''}
              </dd>
              <dt className="text-ink/45">Amount</dt>
              <dd className="text-right font-semibold text-ink">
                {subscriptionDetails?.amount != null
                  ? `${subscriptionDetails.currency} ${(subscriptionDetails.amount / 100).toLocaleString()} (~${pricing.pro.usdLabel} USD)`
                  : unavailableLabel}
              </dd>
              <dt className="text-ink/45">
                {isNonRenewing ? 'Paid through' : 'Next billing date'}
              </dt>
              <dd className="text-right font-semibold text-ink">
                {formatDate(subscriptionDetails?.nextPaymentDate) || formatDate(subscriptionDetails?.accessUntil) || 'Not available'}
              </dd>
            </dl>
            {subscriptionDetailsError && (
              <p role="status" className="text-xs text-ink/45">
                Live billing details are temporarily unavailable. {profile?.subscription_expires_at ? `Access through ${formatDate(profile.subscription_expires_at)}.` : ''}
              </p>
            )}
            {subscriptionDetailsLoading && <p className="text-xs text-ink/40">Refreshing Paystack details...</p>}
            {profile?.subscription_status !== 'cancelled' && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="text-xs cursor-pointer font-semibold text-red-700 underline underline-offset-4 disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Cancel subscription'}
              </button>
            )}
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
      </>
      )}

      {/* Account info */}
      {accountEmail && (
        <div className="bg-white p-5 rounded-2xl border border-ink/10">
          <p className="text-xs font-mono text-ink/35 mb-1">Account</p>
          <p className="text-sm font-medium text-ink">{accountEmail}</p>
          <button
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="mt-4 text-xs cursor-pointer font-semibold text-red-700 underline underline-offset-4 disabled:opacity-50"
          >
            {deleting ? 'Deleting account...' : 'Delete account and saved reports'}
          </button>
          {accountError && <p role="alert" className="mt-3 text-sm text-red-700">{accountError}</p>}
        </div>
      )}
    </div>
  )
}