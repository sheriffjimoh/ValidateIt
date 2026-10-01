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
  planCode?: string | null
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

  if ((!subscription || !subscription.email_token) && (options.customerCode || options.email)) {
    let customerCode = options.customerCode || ''

    if (!customerCode && options.email) {
      const result = await paystackGet<Record<string, unknown>>(
        `/customer/${encodeURIComponent(options.email)}`,
      )
      customerCode = String(result.data?.customer_code || '')
    }

    if (customerCode) {
      const result = await paystackGet<PaystackSubscription[]>(
        `/subscription?customer=${encodeURIComponent(customerCode)}`,
      )
      const candidates = (result.data || []).filter(item =>
        item.subscription_code &&
        (item.status === 'active' || item.status === 'non-renewing') &&
        (!(options.planCode || process.env.PAYSTACK_PRO_PLAN_CODE) ||
          item.plan?.plan_code === (options.planCode || process.env.PAYSTACK_PRO_PLAN_CODE)),
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

export async function resolvePaystackSubscription(options: CancelOptions) {
  return findPaystackSubscription(options)
}

export async function getPaystackSubscriptionDetails(options: CancelOptions) {
  if (!process.env.PAYSTACK_SECRET_KEY) throw new Error('Paystack is not configured')

  let customer: { id?: number; customer_code?: string; email?: string } | undefined
  const customerIdentifier = options.customerCode || options.email

  if (customerIdentifier) {
    const result = await paystackGet<{ id?: number; customer_code?: string; email?: string }>(
      `/customer/${encodeURIComponent(customerIdentifier)}`,
    )
    customer = result.data
  }

  if (!customer?.id) throw new Error('Paystack customer could not be resolved')

  const result = await paystackGet<PaystackSubscription[]>(
    `/subscription?customer=${encodeURIComponent(String(customer.id))}`,
  )
  const planCode = options.planCode || process.env.PAYSTACK_PRO_PLAN_CODE
  const candidates = (result.data || []).filter(subscription =>
    subscription.subscription_code &&
    (!planCode || subscription.plan?.plan_code === planCode),
  )

  const subscription = options.subscriptionCode
    ? candidates.find(item => item.subscription_code === options.subscriptionCode)
    : undefined
  const selectedSubscription = subscription ||
    candidates.find(item => item.status === 'active') ||
    candidates.find(item => item.status === 'non-renewing') ||
    candidates[0]

  if (!selectedSubscription) throw new Error('No ValidateIt Pro subscription was found for this Paystack customer')

  return {
    subscriptionCode: selectedSubscription.subscription_code,
    status: selectedSubscription.status || 'unknown',
    amount: selectedSubscription.amount ?? selectedSubscription.plan?.amount ?? null,
    currency: selectedSubscription.currency || 'NGN',
    planName: selectedSubscription.plan?.name || null,
    interval: selectedSubscription.plan?.interval || null,
    createdAt: selectedSubscription.createdAt || selectedSubscription.start || null,
    nextPaymentDate: selectedSubscription.next_payment_date || null,
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