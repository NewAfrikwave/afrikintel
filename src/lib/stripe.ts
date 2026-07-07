import Stripe from 'stripe'

export type BillingPlan =
  | 'pro'
  | 'business'
  | 'self_hosted_personal'
  | 'self_hosted_team'
  | 'appsumo_tier1'
  | 'appsumo_tier2'

export type OfferKind = 'subscription' | 'license' | 'ltd'

export type BillingOffer = {
  plan: BillingPlan
  kind: OfferKind
  name: string
  price: string
  monitorLimit: number
  stripePriceId?: string
}

export const billingOffers: Record<BillingPlan, BillingOffer> = {
  pro: {
    plan: 'pro',
    kind: 'subscription',
    name: 'Hosted Pro',
    price: '$19/mo',
    monitorLimit: 50,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
  },
  business: {
    plan: 'business',
    kind: 'subscription',
    name: 'Business',
    price: '$79/mo',
    monitorLimit: 200,
    stripePriceId: process.env.STRIPE_BUSINESS_PRICE_ID,
  },
  self_hosted_personal: {
    plan: 'self_hosted_personal',
    kind: 'license',
    name: 'Personal self-hosted license',
    price: '$99',
    monitorLimit: 10,
    stripePriceId: process.env.STRIPE_SELF_HOSTED_PERSONAL_PRICE_ID,
  },
  self_hosted_team: {
    plan: 'self_hosted_team',
    kind: 'license',
    name: 'Team self-hosted license',
    price: '$249',
    monitorLimit: 50,
    stripePriceId: process.env.STRIPE_SELF_HOSTED_TEAM_PRICE_ID,
  },
  appsumo_tier1: {
    plan: 'appsumo_tier1',
    kind: 'ltd',
    name: 'AppSumo Tier 1 LTD',
    price: '$59',
    monitorLimit: 50,
    stripePriceId: process.env.STRIPE_APPSUMO_TIER1_PRICE_ID,
  },
  appsumo_tier2: {
    plan: 'appsumo_tier2',
    kind: 'ltd',
    name: 'AppSumo Tier 2 LTD',
    price: '$99',
    monitorLimit: 200,
    stripePriceId: process.env.STRIPE_APPSUMO_TIER2_PRICE_ID,
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
  const isSubscription = offer.kind === 'subscription'
  const isHostedAccess = offer.kind === 'subscription' || offer.kind === 'ltd'

  return stripe.checkout.sessions.create({
    mode: isSubscription ? 'subscription' : 'payment',
    customer_email: input.email || undefined,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: isHostedAccess
      ? `${appUrl}/dashboard?upgraded=1&plan=${offer.plan}&session_id={CHECKOUT_SESSION_ID}`
      : `${appUrl}/pricing?license=1&plan=${offer.plan}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/pricing?cancelled=1&plan=${offer.plan}`,
    allow_promotion_codes: true,
    automatic_tax: { enabled: process.env.STRIPE_AUTOMATIC_TAX === '1' },
    metadata: {
      plan: offer.plan,
      offer_kind: offer.kind,
      monitor_limit: String(offer.monitorLimit),
      user_id: input.userId || '',
      name: input.name || '',
    },
    subscription_data: isSubscription
      ? {
          metadata: {
            plan: offer.plan,
            offer_kind: offer.kind,
            monitor_limit: String(offer.monitorLimit),
            user_id: input.userId || '',
          },
        }
      : undefined,
  })
}
