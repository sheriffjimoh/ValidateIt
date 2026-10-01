export const pricing = {
  free: {
    usd: 0,
    ngn: 0,
    label: '$0',
    ngnLabel: '₦0',
  },
  pro: {
    usd: 11,
    ngn: 15000,
    usdLabel: '$11.00',
    ngnLabel: '₦15,000',
    monthlyLabel: '₦15,000/month',
    paystackAmountKobo: 1500000,
    checkoutText: 'Billed as ₦15,000 NGN at checkout',
    buttonText: 'Subscribe — ₦15,000 (~$11.00) →',
    upgradeText: 'Upgrade to Pro — ₦15,000/month →',
  },
} as const
