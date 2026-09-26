import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=software&limit=5&country=us`
    )

    const data = await response.json()

    const apps = data.results.map((app: any) => ({
      id:       app.trackId,
      name:     app.trackName,
      developer: app.artistName,
      rating:   app.averageUserRating,
      reviews:  app.userRatingCount,
      icon:     app.artworkUrl100,
      category: app.primaryGenreName,
      url:      app.trackViewUrl,
    }))

    return NextResponse.json({ apps })

  } catch (err) {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}