import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isActivePro } from '@/lib/utils'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
]

type DeepDiveReview = {
  rating: string | number
  title?: string | null
  content?: string | null
}

async function generateWithFallback(prompt: string): Promise<string> {
  let lastError: unknown
  for (const modelName of MODELS) {
    const model = genAI.getGenerativeModel({ model: modelName })
    try {
      const result = await model.generateContent(prompt)
      return result.response.text().trim()
    } catch (error) {
      lastError = error
      const msg = error instanceof Error ? error.message : String(error)
      if (msg.includes('503') || msg.includes('high demand')) {
        await new Promise(r => setTimeout(r, 2000))
      }
      continue
    }
  }
  throw lastError || new Error('All models failed')
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Sign in to use Deep Dive.' }, { status: 401 })

    const admin = createAdminClient()
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('plan_type, subscription_status, subscription_expires_at, deep_dive_used, deep_dive_limit')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Could not load your plan and Deep Dive usage.' }, { status: 500 })
    }

    const hasActivePro = isActivePro(profile)
    const deepDiveLimit = profile.deep_dive_limit ?? 2
    const deepDiveUsed = profile.deep_dive_used ?? 0

    if (!hasActivePro && deepDiveUsed >= deepDiveLimit) {
      return NextResponse.json({
        error: 'You have used your free Deep Dive analyses. Upgrade to Pro for unlimited Deep Dives.',
        used: deepDiveUsed,
        limit: deepDiveLimit,
      }, { status: 403 })
    }

    const { appName, reviews } = await request.json() as {
      appName?: string
      reviews?: DeepDiveReview[]
    }

    if (!appName || !reviews?.length) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 })
    }

    const reviewText = reviews
      .slice(0, 200)
      .map(review => `[${review.rating}★] ${review.title || ''}: ${review.content || ''}`)
      .join('\n')

    const prompt = `
You are a product strategist doing a deep competitive analysis of the app: "${appName}".

Here are ${reviews.length} one and two star reviews from real users of this specific app:

${reviewText}

Analyse these reviews and return a JSON response with this exact structure:
{
  "appName": "${appName}",
  "summary": "2-3 sentence overview of this app's biggest weaknesses based on user reviews",
  "topComplaints": [
    {
      "rank": 1,
      "complaint": "Short description of the complaint (max 8 words)",
      "detail": "One sentence explaining this complaint in more detail",
      "mentions": <estimated number of reviews mentioning this>,
      "severity": "Critical" | "High" | "Medium"
    }
  ],
  "opportunities": [
    {
      "title": "Short opportunity title",
      "description": "One sentence on what you could build to beat this app on this dimension"
    }
  ]
}

Return exactly 5 topComplaints and 3 opportunities.
Return ONLY the JSON. No markdown, no explanation, no backticks.
`

    const text     = await generateWithFallback(prompt)
    const cleaned  = text.replace(/```json|```/g, '').trim()
    const analysis = JSON.parse(cleaned)
    let updatedUsageCount: number | null = null
    let updatedLimit = deepDiveLimit

    for (let attempt = 0; attempt < 3 && updatedUsageCount === null; attempt += 1) {
      const { data: latestProfile, error: latestProfileError } = await admin
        .from('profiles')
        .select('deep_dive_used, deep_dive_limit')
        .eq('id', user.id)
        .single()

      if (latestProfileError || !latestProfile) throw new Error('Could not record Deep Dive usage')

      const currentUsed = latestProfile.deep_dive_used ?? 0
      const currentLimit = hasActivePro ? 99 : (latestProfile.deep_dive_limit ?? 2)
      if (!hasActivePro && currentUsed >= currentLimit) {
        return NextResponse.json({
          error: 'You have used your free Deep Dive analyses. Upgrade to Pro for unlimited Deep Dives.',
          used: currentUsed,
          limit: currentLimit,
        }, { status: 403 })
      }

      const update = admin
        .from('profiles')
        .update({
          deep_dive_used: currentUsed + 1,
          deep_dive_limit: currentLimit,
        })
        .eq('id', user.id)
      const { data: updatedUsage, error: usageError } = latestProfile.deep_dive_used == null
        ? await update.is('deep_dive_used', null).select('deep_dive_used, deep_dive_limit').maybeSingle()
        : await update.eq('deep_dive_used', currentUsed).select('deep_dive_used, deep_dive_limit').maybeSingle()

      if (usageError) {
        console.error('[deep-dive] failed to persist usage:', usageError)
        throw new Error('Could not record Deep Dive usage')
      }
      if (updatedUsage) {
        updatedUsageCount = updatedUsage.deep_dive_used
        updatedLimit = updatedUsage.deep_dive_limit
      }
    }

    if (updatedUsageCount === null) {
      return NextResponse.json({ error: 'Could not confirm your Deep Dive usage. Please retry.' }, { status: 409 })
    }

    return NextResponse.json({
      analysis,
      deepDiveUsed: updatedUsageCount,
      deepDiveLimit: updatedLimit,
    })

  } catch (err: unknown) {
    console.error('[deep-dive]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Deep dive failed' }, { status: 500 })
  }
}