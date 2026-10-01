type PaystackSubscription = {
  subscription_code?: string
  email_token?: string
  status?: string
  amount?: number
  currency?: string
  plan?: { plan_code?: string; name?: string; interval?: string; amount?: number }
  createdAt?: string
  start?: string
  next_payment_date?: string
}

type PaystackResult<T> = {
  status?: boolean
  message?: string
  data?: T
}

type CancelOptions = {
  subscriptionCode?: string | null
  customerCode?: string | null
  email?: string | null
  emailToken?: string | null
}

async function findPaystackSubscription(options: CancelOptions) {
  if (!process.env.PAYSTACK_SECRET_KEY) throw new Error('Paystack is not configured')

  let subscription: PaystackSubscription | undefined

  if (options.subscriptionCode) {
    try {
      const result = await paystackGet<PaystackSubscription>(
        `/subscription/${encodeURIComponent(options.subscriptionCode)}`,
      )
      subscription = result.data
    } catch (error) {
      console.warn('[paystack] subscription lookup by code failed:', error)
    }
  }

  if (!subscription && (options.customerCode || options.email)) {
    let customerCode = options.customerCode || ''

    if (!customerCode && options.email) {
      const result = await paystackGet<Record<string, unknown> | Array<Record<string, unknown>>>(
        `/customer?email=${encodeURIComponent(options.email)}`,
      )
      const customers = Array.isArray(result.data) ? result.data : result.data ? [result.data] : []
      const customer = customers.find(item => item.customer_code && (!item.email || item.email === options.email))
      customerCode = String(customer?.customer_code || '')
    }

    if (customerCode) {
      const result = await paystackGet<PaystackSubscription[]>(
        `/subscription?customer=${encodeURIComponent(customerCode)}`,
      )
      const candidates = (result.data || []).filter(item =>
        item.subscription_code &&
        (item.status === 'active' || item.status === 'non-renewing') &&
        (!process.env.PAYSTACK_PRO_PLAN_CODE || item.plan?.plan_code === process.env.PAYSTACK_PRO_PLAN_CODE),
      )
      const matching = options.subscriptionCode
        ? candidates.find(item => item.subscription_code === options.subscriptionCode)
        : undefined
      const active = candidates.filter(item => item.status === 'active')

      if (matching) subscription = matching
      else if (active.length === 1) subscription = active[0]
      else if (active.length > 1) throw new Error('Multiple active subscriptions found; contact support to avoid cancelling the wrong plan')
      else if (candidates.length) subscription = candidates[0]
    }
  }

  if (!subscription?.subscription_code) {
    throw new Error('No matching Paystack subscription was found')
  }

  return subscription
}

export async function getPaystackSubscriptionDetails(options: CancelOptions) {
  const subscription = await findPaystackSubscription(options)
  return {
    subscriptionCode: subscription.subscription_code,
    status: subscription.status || 'unknown',
    amount: subscription.amount ?? subscription.plan?.amount ?? null,
    currency: subscription.currency || 'NGN',
    planName: subscription.plan?.name || null,
    interval: subscription.plan?.interval || null,
    createdAt: subscription.createdAt || subscription.start || null,
    nextPaymentDate: subscription.next_payment_date || null,
  }
}

async function paystackGet<T>(path: string): Promise<PaystackResult<T>> {
  const response = await fetch(`https://api.paystack.co${path}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  })
  const result = await response.json() as PaystackResult<T>
  if (!response.ok || !result.status) {
    throw new Error(result.message || 'Could not verify subscription with Paystack')
  }
  return result
}

export async function cancelOrConfirmPaystackSubscription(options: CancelOptions) {
  const subscription = await findPaystackSubscription(options)

  const normalizedStatus = subscription.status?.toLowerCase().replace(/[_ ]/g, '-')
  if (normalizedStatus === 'non-renewing' || normalizedStatus === 'nonrenewing') {
    return { cancelled: true, alreadyCancelled: true, subscription }
  }

  const token = subscription.email_token || options.emailToken
  if (!token) throw new Error('Paystack did not return the cancellation token')

  const response = await fetch('https://api.paystack.co/subscription/disable', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code: subscription.subscription_code, token }),
  })

  const result = await response.json() as PaystackResult<unknown>
  if (!response.ok || !result.status) {
    throw new Error(result.message || 'Paystack could not cancel this subscription')
  }

  return { cancelled: true, alreadyCancelled: false, subscription }
}