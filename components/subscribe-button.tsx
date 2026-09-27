'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  className?: string
  children?: React.ReactNode
}

export default function SubscribeButton({ className, children }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubscribe = async () => {
    setLoading(true)

    try {
      const res  = await fetch('/api/subscribe', { method: 'POST' })
      const data = await res.json()

      if (data.error) {
        alert(data.error)
        setLoading(false)
        return
      }

      // Redirect to Paystack checkout
      window.location.href = data.url

    } catch (err) {
      alert('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={loading}
      className={className}
    >
      {loading ? 'Redirecting to payment...' : children || 'Subscribe to Pro'}
    </button>
  )
}