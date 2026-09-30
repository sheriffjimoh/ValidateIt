import { NextResponse } from 'next/server'
import gplay from 'google-play-scraper'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 })
  }

  try {
    const results = await gplay.search({
      term:    query,
      num:     5,
      lang:    'en',
      country: 'us',
    })

    const apps = results.map((app: any) => ({
      id:        app.appId,
      name:      app.title,
      developer: app.developer,
      rating:    app.score,
      reviews:   app.reviews,
      icon:      app.icon,
      store:     'playstore',
    }))
    return NextResponse.json({ apps })

  } catch (err: any) {
    console.error('[playstore search]', err.message)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}