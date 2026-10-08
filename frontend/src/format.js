export const inr = (n) => `₹${n.toLocaleString('en-IN')}`

// Must match PLATFORM_FEE_RATE in backend/app/main.py.
export const PLATFORM_FEE_RATE = 0.1
export const payoutFor = (budget) => budget - Math.round(budget * PLATFORM_FEE_RATE)

export const STATUS_LABEL = {
  open: 'Choosing a student',
  offered: 'Offer sent',
  assigned: 'In progress',
  delivered: 'Ready for review',
  completed: 'Completed',
}

export const shortDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
