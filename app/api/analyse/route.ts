import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
]

class GeminiUnavailableError extends Error {
  constructor() {
    super('AI analysis is temporarily busy. Your selected apps are saved; please try again shortly.')
    this.name = 'GeminiUnavailableError'
  }
}

function getProviderError(error: unknown) {
  const providerError = error as { message?: string; status?: number; statusCode?: number }
  return {
    message: providerError?.message || String(error),
    status: providerError?.status ?? providerError?.statusCode,
  }
}

const wait = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds))

type ReviewInput = { rating: string | number; title?: string | null; content?: string | null }
type AppInput = { name: string }

async function generateWithFallback(prompt: string): Promise<string> {
  let lastError: unknown
  let hadTemporaryFailure = false

  for (const modelName of MODELS) {
    console.log(`[analyse] trying model: ${modelName}`)
    const model = genAI.getGenerativeModel({ model: modelName })

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const result = await model.generateContent(prompt)
        const text = result.response.text().trim()
        console.log(`[analyse] success with model: ${modelName}`)
        return text
      } catch (error) {
        lastError = error
        const { message, status } = getProviderError(error)
        const isTemporary = status === 429 || status === 503 || status === 504 ||
          /high demand|service unavailable|\b503\b|\b429\b|\b504\b/i.test(message)
        console.warn(`[analyse] ${modelName} attempt ${attempt + 1} failed: ${message.slice(0, 100)}`)

        if (!isTemporary) break
        hadTemporaryFailure = true
        if (attempt === 0) await wait(800)
      }
    }
  }

  if (hadTemporaryFailure) throw new GeminiUnavailableError()
  throw lastError || new Error('All models failed')
}

export async function POST(request: Request) {
  try {
    const { market, apps, reviews } = await request.json() as {
      market?: string
      apps?: AppInput[]
      reviews?: ReviewInput[]
    }

    if (!market || !apps?.length || !reviews?.length) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 })
    }

    const reviewText = reviews
      .slice(0, 200)
      .map(review => `[${review.rating}★] ${review.title || ''}: ${review.content || ''}`)
      .join('\n')

    const prompt = `
You are a product strategist analysing App Store reviews for the market: "${market}".

Apps analysed: ${apps.map(app => app.name).join(', ')}

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

  } catch (err: unknown) {
    const { message, status } = getProviderError(err)
    const unavailable = err instanceof GeminiUnavailableError || status === 429 || status === 503 || status === 504
    console.error('[analyse] full error:', message)
    return NextResponse.json(
      { error: unavailable ? 'AI analysis is temporarily busy. Your selected apps are saved; please try again shortly.' : 'Analysis failed. Please try again.' },
      { status: unavailable ? 503 : 500 }
    )
  }
}