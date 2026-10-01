import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cancelOrConfirmPaystackSubscription } from '@/lib/paystack-subscription'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_status, subscription_expires_at, paystack_subscription_code, paystack_customer_code')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Could not load your subscription' }, { status: 404 })
    }
    if (profile.subscription_status === 'cancelled') {
      return NextResponse.json({ cancelled: true, expiresAt: profile.subscription_expires_at })
    }
    const admin = createAdminClient()
    const { data: savedSubscription, error: subscriptionError } = await admin
      .from('paystack_subscriptions')
      .select('subscription_code, email_token')
      .eq('user_id', user.id)
      .maybeSingle()

    if (subscriptionError) {
      console.error('[cancel-subscription] credential lookup failed:', subscriptionError)
      return NextResponse.json({ error: 'Could not verify your cancellation details. Please try again or contact support.' }, { status: 500 })
    }

    let outcome
    try {
      outcome = await cancelOrConfirmPaystackSubscription({
        subscriptionCode: savedSubscription?.subscription_code || profile.paystack_subscription_code,
        customerCode: profile.paystack_customer_code,
        email: user.email,
        emailToken: savedSubscription?.email_token,
      })
    } catch (error) {
      console.error('[cancel-subscription] Paystack cancellation failed:', error)
      return NextResponse.json({ error: 'We could not verify or cancel this subscription in Paystack. Check its status in Paystack or contact support before your next renewal.' }, { status: 409 })
    }

    const { error: updateError } = await admin
      .from('profiles')
      .update({
        subscription_status: 'cancelled',
        paystack_subscription_code: outcome.subscription.subscription_code,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('[cancel-subscription] profile update failed:', updateError)
      return NextResponse.json({ error: 'Billing was cancelled, but your account status could not be updated. Contact support.' }, { status: 500 })
    }

    if (outcome.subscription.email_token) {
      const { error: saveError } = await admin
        .from('paystack_subscriptions')
        .upsert({
          user_id: user.id,
          subscription_code: outcome.subscription.subscription_code,
          email_token: outcome.subscription.email_token,
          updated_at: new Date().toISOString(),
        })
      if (saveError) console.error('[cancel-subscription] credential save failed:', saveError)
    }

    return NextResponse.json({ cancelled: true, alreadyCancelled: outcome.alreadyCancelled, expiresAt: profile.subscription_expires_at })
  } catch (error) {
    console.error('[cancel-subscription] error:', error)
    return NextResponse.json({ error: 'Could not cancel the subscription. Please try again or contact support.' }, { status: 502 })
  }
}