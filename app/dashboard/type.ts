
export type Gap = {
  rank: number
  complaint: string
  detail: string
  mentions: number
  opportunity: 'Critical' | 'High' | 'Medium'
}

export type Analysis = {
  summary: string
  gaps: Gap[]
}

export type SavedReport = {
  id: string
  market_query: string
  created_at: string
  selected_apps: App[]
  review_count: number
  analysis: Analysis
}

export type Profile = {
  id: string
  email: string
  plan_type: 'free' | 'pro'
  credits_used: number
  credits_limit: number
}



export  type App = {
  id: string
  name: string
  developer: string
  rating: number
  reviews: number
  icon: string
  store?: 'appstore' | 'playstore'
}