import { NextResponse } from 'next/server'
import gplay from 'google-play-scraper'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const appId = searchParams.get('appId')

  if (!appId) {
    return NextResponse.json({ error: 'Missing appId' }, { status: 400 })
  }

  try {
    // Fetch 1 and 2 star reviews from Play Store.
    // The library's typings are out of date with the runtime API, so we cast
    // the request options to any to satisfy TypeScript without changing behavior.
    const fetchReviewsByStar = (star: number) =>
      gplay.reviews({
        appId,
        sort: 'NEWEST' as any,
        num: 200,
        star,
        lang: 'en',
        country: 'us',
      } as any)

    const [oneStars, twoStars] = await Promise.all([
      fetchReviewsByStar(1),
      fetchReviewsByStar(2),
    ])

    const complaints = [
      ...oneStars.data.map((r: any) => ({
        rating:  '1',
        title:   r.title || '',
        content: r.text  || '',
      })),
      ...twoStars.data.map((r: any) => ({
        rating:  '2',
        title:   r.title || '',
        content: r.text  || '',
      })),
    ]

    return NextResponse.json({
      total:      complaints.length,
      complaints: complaints.length,
      reviews:    complaints,
    })

  } catch (err: any) {
    console.error('[playstore]', err.message)
    return NextResponse.json({ error: 'Failed to fetch Play Store reviews' }, { status: 500 })
  }
}