import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cancelOrConfirmPaystackSubscription } from '@/lib/paystack-subscription'

export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    const admin = createAdminClient()

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plan_type, subscription_status, paystack_subscription_code, paystack_customer_code')
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Could not verify your billing status' }, { status: 500 })
    }

    const { data: subscription, error: subscriptionError } = await admin
      .from('paystack_subscriptions')
      .select('subscription_code, email_token')
      .eq('user_id', user.id)
      .maybeSingle()

    if (subscriptionError) {
      return NextResponse.json({ error: 'Could not verify your billing credentials' }, { status: 500 })
    }

    const hasBillingRecord = profile?.plan_type === 'pro' || profile?.paystack_subscription_code || profile?.paystack_customer_code || subscription

    if (hasBillingRecord) {
      try {
        await cancelOrConfirmPaystackSubscription({
          subscriptionCode: subscription?.subscription_code || profile?.paystack_subscription_code,
          customerCode: profile?.paystack_customer_code,
          email: user.email,
          emailToken: subscription?.email_token,
        })
      } catch (error) {
        console.error('[delete-account] unable to verify/cancel Paystack subscription:', error)
        return NextResponse.json({ error: 'We could not verify that Paystack will not renew. Check the subscription in Paystack or contact support before deleting your account.' }, { status: 409 })
      }
    }

    const { error: reportsError } = await admin
      .from('saved_searches')
      .delete()
      .eq('user_id', user.id)
    if (reportsError) throw reportsError

    const { error: profileDeleteError } = await admin
      .from('profiles')
      .delete()
      .eq('id', user.id)
    if (profileDeleteError) throw profileDeleteError

    const { error: userDeleteError } = await admin.auth.admin.deleteUser(user.id)
    if (userDeleteError) throw userDeleteError

    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error('[delete-account] error:', error)
    return NextResponse.json({ error: 'Account deletion did not finish. Contact support before retrying.' }, { status: 500 })
  }
}