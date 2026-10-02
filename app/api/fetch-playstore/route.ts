import { NextResponse } from 'next/server'
import gplay from 'google-play-scraper'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const appId = searchParams.get('appId')

  if (!appId) {
    return NextResponse.json({ error: 'Missing appId' }, { status: 400 })
  }

  try {
    const { data: fetchedReviews } = await gplay.reviews({
      appId,
      sort: 2 as Parameters<typeof gplay.reviews>[0]['sort'],
      num: 200,
      lang: 'en',
      country: 'us',
    })

    const complaints = fetchedReviews
      .filter(review => review.score === 1 || review.score === 2)
      .map(review => ({
        rating: String(review.score),
        title: review.title || '',
        content: review.text || '',
      }))

    return NextResponse.json({
      total:      complaints.length,
      complaints: complaints.length,
      reviews:    complaints,
    })

  } catch (err: unknown) {
    console.error('[playstore]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to fetch Play Store reviews' }, { status: 500 })
  }
}