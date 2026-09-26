import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const appId = searchParams.get('appId')

  if (!appId) {
    return NextResponse.json({ error: 'Missing appId' }, { status: 400 })
  }

  try {
    // Fetch up to 10 pages of reviews (500 reviews per app)
    const pages = [1, 2, 3, 4, 5]
    const allReviews: any[] = []

    await Promise.all(
      pages.map(async (page) => {
        const res = await fetch(
          `https://itunes.apple.com/us/rss/customerreviews/page=${page}/id=${appId}/sortby=mostrecent/json`,
          { next: { revalidate: 3600 } }
        )

        if (!res.ok) return

        const data = await res.json()
        const entries = data?.feed?.entry

        if (!entries || !Array.isArray(entries)) return

        entries.forEach((entry: any) => {
          // Skip the first entry — it's app metadata not a review
          if (!entry['im:rating']) return

          allReviews.push({
            rating:  entry['im:rating']?.label,
            title:   entry?.title?.label,
            content: entry?.content?.label,
          })
        })
      })
    )

    // Filter to only 1 and 2 star reviews — the complaints
    const complaints = allReviews.filter(
      (r) => r.rating === '1' || r.rating === '2'
    )

    return NextResponse.json({
      total:      allReviews.length,
      complaints: complaints.length,
      reviews:    complaints,
    })

  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}