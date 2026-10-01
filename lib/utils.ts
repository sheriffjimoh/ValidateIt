import type { Profile } from '@/app/dashboard/type'

export const GAPS = [
  { rank: 1, text: "Can't accept payments in-app", mentions: 340, hot: true },
  { rank: 2, text: 'No recurring invoice feature', mentions: 210, hot: true },
  { rank: 3, text: 'Too expensive for solo freelancers', mentions: 180, hot: false },
  { rank: 4, text: 'No client status portal', mentions: 150, hot: false },
]

export function isActivePro(profile?: Pick<Profile, 'plan_type' | 'subscription_status' | 'subscription_expires_at'> | null): boolean {
  if (!profile || profile.plan_type !== 'pro') return false

  if (profile.subscription_status === 'cancelled' || profile.subscription_status === 'past_due') {
    return Boolean(profile.subscription_expires_at && new Date(profile.subscription_expires_at).getTime() > Date.now())
  }

  if (!profile.subscription_status) return true

  return profile.subscription_status === 'active'
}

