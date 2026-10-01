import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { pricing } from '@/lib/pricing'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Get logged in user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
      
    }


    const host     = request.headers.get('host') || ''
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const baseUrl  = `${protocol}://${host}`

    console.log('[subscribe] baseUrl detected:', baseUrl)

    // Get their profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Initialize Paystack transaction
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount: pricing.pro.paystackAmountKobo,
        plan:   process.env.PAYSTACK_PRO_PLAN_CODE,
        description: `ValidateIt Pro — ${pricing.pro.monthlyLabel}`,
        metadata: {
          price_usd: pricing.pro.usdLabel,
          price_ngn: pricing.pro.ngnLabel,
          user_id:    user.id,
          user_email: user.email,
        },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || `https://${request.headers.get('host')}`}/dashboard?payment=success`,
      }),
    })

    const data = await response.json()

    if (!data.status) {
      console.error('[subscribe] Paystack error:', data.message)
      return NextResponse.json({ error: data.message }, { status: 400 })
    }

    // Return the checkout URL
    return NextResponse.json({
      url: data.data.authorization_url,
      reference: data.data.reference,
    })

  } catch (err: any) {
    console.error('[subscribe] error:', err.message)
    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 })
  }
}