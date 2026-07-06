import { createCheckout, lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js'

export type BillingPlan = 'pro' | 'business'

const variantByPlan: Record<BillingPlan, string | undefined> = {
  pro: process.env.LS_PRO_VARIANT_ID,
  business: process.env.LS_BUSINESS_VARIANT_ID,
}

export function billingPlanFromVariant(variantId?: string | number | null) {
  const id = variantId?.toString()
  if (!id) return 'free'
  if (id === process.env.LS_BUSINESS_VARIANT_ID) return 'business'
  if (id === process.env.LS_PRO_VARIANT_ID) return 'pro'
  return 'free'
}

export function requireBillingConfig(plan: BillingPlan) {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY
  const storeId = process.env.LS_STORE_ID
  const variantId = variantByPlan[plan]

  if (!apiKey || !storeId || !variantId) {
    throw new Error('Lemon Squeezy is not configured for this plan')
  }

  lemonSqueezySetup({ apiKey })
  return { storeId, variantId }
}

export async function createPlanCheckout(input: {
  plan: BillingPlan
  email?: string | null
  name?: string | null
  userId?: string | null
}) {
  const { storeId, variantId } = requireBillingConfig(input.plan)
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  return createCheckout(storeId, variantId, {
    productOptions: {
      redirectUrl: `${appUrl}/dashboard?upgraded=1`,
      receiptButtonText: 'Open Afrikintel',
      receiptLinkUrl: `${appUrl}/dashboard`,
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
        user_id: input.userId || '',
      },
    },
  })
}
