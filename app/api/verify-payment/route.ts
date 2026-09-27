import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const reference = searchParams.get('reference')

  if (!reference) {
    return NextResponse.json({ error: 'Missing reference' }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    )

    const data = await response.json()

    return NextResponse.json({
      success: data.data?.status === 'success',
      plan:    data.data?.plan,
      email:   data.data?.customer?.email,
    })

  } catch (err: any) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}