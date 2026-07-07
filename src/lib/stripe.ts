import Stripe from 'stripe'

export type BillingPlan = 'self_hosted_personal' | 'self_hosted_team'
export type OfferKind = 'license'

export type BillingOffer = {
  plan: BillingPlan
  kind: OfferKind
  name: string
  price: string
  instanceLimit: string
  stripePriceId?: string
}

export const billingOffers: Record<BillingPlan, BillingOffer> = {
  self_hosted_personal: {
    plan: 'self_hosted_personal',
    kind: 'license',
    name: 'Personal self-hosted license',
    price: '$99',
    instanceLimit: '1 production instance',
    stripePriceId: process.env.STRIPE_SELF_HOSTED_PERSONAL_PRICE_ID,
  },
  self_hosted_team: {
    plan: 'self_hosted_team',
    kind: 'license',
    name: 'Team self-hosted license',
    price: '$249',
    instanceLimit: 'Up to 5 production instances',
    stripePriceId: process.env.STRIPE_SELF_HOSTED_TEAM_PRICE_ID,
  },
}

export function stripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('Stripe is not configured: missing STRIPE_SECRET_KEY')
  }

  return new Stripe(secretKey, {
    apiVersion: '2026-06-24.dahlia',
  })
}

export function billingPlanFromPrice(priceId?: string | null) {
  if (!priceId) return 'free'
  const offer = Object.values(billingOffers).find((item) => item.stripePriceId === priceId)
  return offer?.plan || 'free'
}

export function billingOfferFromPrice(priceId?: string | null) {
  if (!priceId) return null
  return Object.values(billingOffers).find((item) => item.stripePriceId === priceId) || null
}

export function requireBillingConfig(plan: BillingPlan) {
  const offer = billingOffers[plan]
  if (!offer?.stripePriceId) {
    throw new Error(`Stripe is not configured for ${offer?.name || plan}`)
  }

  return { stripe: stripeClient(), offer, priceId: offer.stripePriceId }
}

export async function createPlanCheckout(input: {
  plan: BillingPlan
  email?: string | null
  name?: string | null
  userId?: string | null
}) {
  const { stripe, offer, priceId } = requireBillingConfig(input.plan)
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  return stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: input.email || undefined,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/pricing?license=1&plan=${offer.plan}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/pricing?cancelled=1&plan=${offer.plan}`,
    allow_promotion_codes: true,
    automatic_tax: { enabled: process.env.STRIPE_AUTOMATIC_TAX === '1' },
    metadata: {
      plan: offer.plan,
      offer_kind: offer.kind,
      instance_limit: offer.instanceLimit,
      user_id: input.userId || '',
      name: input.name || '',
    },
  })
}
