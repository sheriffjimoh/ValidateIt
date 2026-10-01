import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Use service role to bypass RLS for webhook updates


function verifyPaystackSignature(body: string, signature: string): boolean {
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
    .update(body)
    .digest('hex')
  return hash === signature
}

export async function POST(request: Request) {

 const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
  try {
    const body      = await request.text()
    const signature = request.headers.get('x-paystack-signature') || ''

    // Verify the webhook is actually from Paystack
    if (!verifyPaystackSignature(body, signature)) {
      console.error('[webhook] Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body)
    console.log('[webhook] event:', event.event)

    switch (event.event) {

      // Fires when a subscription payment succeeds
      case 'subscription.create':
      case 'charge.success': {
        const data      = event.data
        const userId    = data.metadata?.user_id
        const email     = data.customer?.email
        const subCode   = data.subscription_code || data.plan?.subscription_code

        if (!userId && !email) break

        // Calculate expiry — 1 month from now
        const expiresAt = data.next_payment_date || data.subscription?.next_payment_date || data.plan?.next_payment_date
          ? new Date(data.next_payment_date || data.subscription?.next_payment_date || data.plan?.next_payment_date)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

        // Update by user_id if available, otherwise by email
        const query = userId
          ? supabase.from('profiles').update({
              plan_type:                  'pro',
              credits_limit:              999,
              subscription_status:        'active',
              subscription_expires_at:    expiresAt.toISOString(),
              paystack_customer_code:     data.customer?.customer_code,
              paystack_subscription_code: subCode,
            }).eq('id', userId)
          : supabase.from('profiles').update({
              plan_type:               'pro',
              credits_limit:           999,
              subscription_status:     'active',
              subscription_expires_at: expiresAt.toISOString(),
            }).eq('email', email)

        const { error } = await query
        if (error) console.error('[webhook] update error:', error)
        else console.log('[webhook] upgraded user to pro:', userId || email)

        const emailToken = data.email_token || data.subscription?.email_token
        if (userId && subCode && emailToken) {
          const { error: credentialError } = await supabase
            .from('paystack_subscriptions')
            .upsert({
              user_id: userId,
              subscription_code: subCode,
              email_token: emailToken,
              updated_at: new Date().toISOString(),
            })
          if (credentialError) console.error('[webhook] subscription credential save failed:', credentialError)
        }
        break
      }

      case 'subscription.disable': {
        const data  = event.data
        const subCode = data.subscription_code || data.subscription?.subscription_code
        const email = data.customer?.email || data.email

        if (!email && !subCode) break

        const { error } = subCode
          ? await supabase.from('profiles').update({ subscription_status: 'cancelled' }).eq('paystack_subscription_code', subCode)
          : await supabase.from('profiles').update({ subscription_status: 'cancelled' }).eq('email', email!)

        if (error) console.error('[webhook] cancellation update error:', error)
        else console.log('[webhook] marked subscription cancelled:', email || subCode)
        break
      }

      case 'invoice.payment_failed': {
        const email = event.data.customer?.email
        if (!email) break

        const { error } = await supabase
          .from('profiles')
          .update({ subscription_status: 'past_due' })
          .eq('email', email)

        if (error) console.error('[webhook] payment failure update error:', error)
        break
      }

      default:
        console.log('[webhook] unhandled event:', event.event)
    }

    return NextResponse.json({ received: true })

  } catch (err: unknown) {
    console.error('[webhook] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
  }
}