import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPaystackSubscriptionDetails } from '@/lib/paystack-subscription'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('paystack_subscription_code, paystack_customer_code, subscription_expires_at')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Could not load your subscription profile' }, { status: 404 })
    }

    const details = await getPaystackSubscriptionDetails({
      subscriptionCode: profile.paystack_subscription_code,
      customerCode: profile.paystack_customer_code,
      email: user.email,
      planCode: process.env.PAYSTACK_PRO_PLAN_CODE,
    })

    return NextResponse.json({
      ...details,
      accessUntil: profile.subscription_expires_at,
    })
  } catch (error) {
    console.error('[subscription-details] lookup failed:', error)
    return NextResponse.json({ error: 'Paystack subscription details are temporarily unavailable' }, { status: 502 })
  }
}