import { NextResponse } from 'next/server'
import gplay from 'google-play-scraper'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const appId = searchParams.get('appId')

  if (!appId) {
    return NextResponse.json({ error: 'Missing appId' }, { status: 400 })
  }

  try {
    // Fetch 1 and 2 star reviews from Play Store
    const [oneStars, twoStars] = await Promise.all([
      gplay.reviews({
        appId,
        sort:    gplay.sort.NEWEST,
        num:     200,
        star:    1,
        lang:    'en',
        country: 'us',
      }),
      gplay.reviews({
        appId,
        sort:    gplay.sort.NEWEST,
        num:     200,
        star:    2,
        lang:    'en',
        country: 'us',
      }),
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