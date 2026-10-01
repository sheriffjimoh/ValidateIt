import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

    const admin = createAdminClient()
    const { data: savedSubscription, error: credentialError } = await admin
      .from('paystack_subscriptions')
      .select('subscription_code')
      .eq('user_id', user.id)
      .maybeSingle()


      console.log('[subscription-details] savedSubscription:', savedSubscription)
      console.log('[subscription-details] profile:', profile)

    if (credentialError) {
      console.error('[subscription-details] credential lookup failed:', credentialError)
      return NextResponse.json({ error: 'Could not load your subscription details' }, { status: 500 })
    }

    const details = await getPaystackSubscriptionDetails({
      subscriptionCode: savedSubscription?.subscription_code || profile.paystack_subscription_code,
      customerCode: profile.paystack_customer_code,
      email: user.email,
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