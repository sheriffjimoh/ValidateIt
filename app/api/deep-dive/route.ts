import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
]

async function generateWithFallback(prompt: string): Promise<string> {
  let lastError: any
  for (const modelName of MODELS) {
    const model = genAI.getGenerativeModel({ model: modelName })
    try {
      const result = await model.generateContent(prompt)
      return result.response.text().trim()
    } catch (err: any) {
      lastError = err
      const msg = err?.message || ''
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
    const { appName, appId, store, reviews } = await request.json()

    if (!appName || !reviews || reviews.length === 0) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 })
    }

    const reviewText = reviews
      .slice(0, 200)
      .map((r: any) => `[${r.rating}★] ${r.title}: ${r.content}`)
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

    return NextResponse.json({ analysis })

  } catch (err: any) {
    console.error('[deep-dive]', err.message)
    return NextResponse.json({ error: 'Deep dive failed' }, { status: 500 })
  }
}