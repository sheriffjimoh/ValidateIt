export const pricing = {
  free: {
    usd: 0,
    ngn: 0,
    label: '$0',
    ngnLabel: '₦0',
  },
  pro: {
    usd: 11,
    ngn: 14000,
    usdLabel: '$11.00',
    ngnLabel: '₦14,000',
    monthlyLabel: '$11.00/month (₦14,000 NGN)',
    paystackAmountKobo: 1400000,
    checkoutText: 'Billed as ₦14,000 NGN at checkout',
    buttonText: 'Subscribe — ₦14,000 (~$11.00) →',
    upgradeText: 'Upgrade to Pro — $11.00/month (₦14,000 NGN) →',
  },
} as const
