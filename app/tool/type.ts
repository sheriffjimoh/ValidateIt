type App = {
  id: number
  name: string
  developer: string
  rating: number
  reviews: number
  icon: string
}

type Gap = {
  rank: number
  complaint: string
  detail: string
  mentions: number
  opportunity: 'Critical' | 'High' | 'Medium'
}

type Analysis = {
  summary: string
  gaps: Gap[]
}

type Step = 'search' | 'select' | 'analyse' | 'results'

export type { App, Gap, Analysis, Step }