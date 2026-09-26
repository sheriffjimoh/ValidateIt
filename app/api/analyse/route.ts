import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
]

async function generateWithFallback(prompt: string): Promise<string> {
  let lastError: any

  for (const modelName of MODELS) {
    console.log(`[analyse] trying model: ${modelName}`)
    const model = genAI.getGenerativeModel({ model: modelName })

    try {
      const result = await model.generateContent(prompt)
      const text = result.response.text().trim()
      console.log(`[analyse] success with model: ${modelName}`)
      return text
    } catch (err: any) {
      lastError = err
      const msg = err?.message || ''
      console.log(`[analyse] ${modelName} failed: ${msg.slice(0, 80)}`)

      // 404 = model not available, try next immediately
      if (msg.includes('404') || msg.includes('not found')) {
        continue
      }

      // 503 = overloaded, wait then try next
      if (msg.includes('503') || msg.includes('high demand') || msg.includes('Service Unavailable')) {
        await new Promise(r => setTimeout(r, 2000))
        continue
      }

      // Any other error — try next model
      continue
    }
  }

  // All models failed
  throw lastError || new Error('All models failed')
}

export async function POST(request: Request) {
  try {
    const { market, apps, reviews } = await request.json()

    if (!market || !reviews || reviews.length === 0) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 })
    }

    const reviewText = reviews
      .slice(0, 200)
      .map((r: any) => `[${r.rating}★] ${r.title}: ${r.content}`)
      .join('\n')

    const prompt = `
You are a product strategist analysing App Store reviews for the market: "${market}".

Apps analysed: ${apps.map((a: any) => a.name).join(', ')}

Here are ${reviews.length} one and two star reviews from real users:

${reviewText}

Analyse these reviews and return a JSON response with this exact structure:
{
  "summary": "2-3 sentence overview of the main pain points in this market",
  "gaps": [
    {
      "rank": 1,
      "complaint": "Short description of the complaint (max 8 words)",
      "detail": "One sentence explaining this gap in more detail",
      "mentions": <estimated number of reviews mentioning this>,
      "opportunity": "Critical" | "High" | "Medium"
    }
  ]
}

Return exactly 5 gaps, ranked by frequency and severity.
Return ONLY the JSON. No markdown, no explanation, no backticks.
`

    const text = await generateWithFallback(prompt)

    // Strip any accidental markdown backticks just in case
    const cleaned = text.replace(/```json|```/g, '').trim()
    const analysis = JSON.parse(cleaned)

    return NextResponse.json({ analysis })

  } catch (err: any) {
    console.error('[analyse] full error:', err?.message || err)
    return NextResponse.json(
      { error: 'Analysis failed', detail: err?.message },
      { status: 500 }
    )
  }
}