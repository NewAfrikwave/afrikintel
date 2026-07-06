import { createCheckout, lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js'

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
  variantId?: string
}

export const billingOffers: Record<BillingPlan, BillingOffer> = {
  pro: {
    plan: 'pro',
    kind: 'subscription',
    name: 'Hosted Pro',
    price: '$19/mo',
    monitorLimit: 50,
    variantId: process.env.LS_PRO_VARIANT_ID,
  },
  business: {
    plan: 'business',
    kind: 'subscription',
    name: 'Business',
    price: '$79/mo',
    monitorLimit: 200,
    variantId: process.env.LS_BUSINESS_VARIANT_ID,
  },
  self_hosted_personal: {
    plan: 'self_hosted_personal',
    kind: 'license',
    name: 'Personal self-hosted license',
    price: '$99',
    monitorLimit: 10,
    variantId: process.env.LS_SELF_HOSTED_PERSONAL_VARIANT_ID,
  },
  self_hosted_team: {
    plan: 'self_hosted_team',
    kind: 'license',
    name: 'Team self-hosted license',
    price: '$249',
    monitorLimit: 50,
    variantId: process.env.LS_SELF_HOSTED_TEAM_VARIANT_ID,
  },
  appsumo_tier1: {
    plan: 'appsumo_tier1',
    kind: 'ltd',
    name: 'AppSumo Tier 1 LTD',
    price: '$59',
    monitorLimit: 50,
    variantId: process.env.LS_APPSUMO_TIER1_VARIANT_ID,
  },
  appsumo_tier2: {
    plan: 'appsumo_tier2',
    kind: 'ltd',
    name: 'AppSumo Tier 2 LTD',
    price: '$99',
    monitorLimit: 200,
    variantId: process.env.LS_APPSUMO_TIER2_VARIANT_ID,
  },
}

const variantByPlan = Object.fromEntries(
  Object.entries(billingOffers).map(([plan, offer]) => [plan, offer.variantId]),
) as Record<BillingPlan, string | undefined>

export function billingPlanFromVariant(variantId?: string | number | null) {
  const id = variantId?.toString()
  if (!id) return 'free'
  const offer = Object.values(billingOffers).find((item) => item.variantId === id)
  if (offer) return offer.plan
  return 'free'
}

export function billingOfferFromVariant(variantId?: string | number | null) {
  const id = variantId?.toString()
  if (!id) return null
  return Object.values(billingOffers).find((item) => item.variantId === id) || null
}

export function requireBillingConfig(plan: BillingPlan) {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY
  const storeId = process.env.LS_STORE_ID
  const offer = billingOffers[plan]
  const variantId = variantByPlan[plan]

  if (!offer || !apiKey || !storeId || !variantId) {
    throw new Error(`Lemon Squeezy is not configured for ${offer?.name || plan}`)
  }

  lemonSqueezySetup({ apiKey })
  return { storeId, variantId, offer }
}

export async function createPlanCheckout(input: {
  plan: BillingPlan
  email?: string | null
  name?: string | null
  userId?: string | null
}) {
  const { storeId, variantId, offer } = requireBillingConfig(input.plan)
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const isHostedAccess = offer.kind === 'subscription' || offer.kind === 'ltd'
  const redirectUrl = isHostedAccess
    ? `${appUrl}/dashboard?upgraded=1&plan=${offer.plan}`
    : `${appUrl}/pricing?license=1&plan=${offer.plan}`

  return createCheckout(storeId, variantId, {
    productOptions: {
      redirectUrl,
      receiptButtonText: isHostedAccess ? 'Open Afrikintel' : 'Return to Afrikintel',
      receiptLinkUrl: isHostedAccess ? `${appUrl}/dashboard` : `${appUrl}/pricing`,
    },
    checkoutOptions: {
      media: true,
      logo: true,
      discount: true,
      buttonColor: '#10b981',
      buttonTextColor: '#04130d',
    },
    checkoutData: {
      email: input.email || undefined,
      name: input.name || undefined,
      custom: {
        plan: input.plan,
        offer_kind: offer.kind,
        monitor_limit: String(offer.monitorLimit),
        user_id: input.userId || '',
      },
    },
  })
}
