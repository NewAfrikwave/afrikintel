import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { billingOffers, createPlanCheckout, type BillingPlan } from '@/lib/stripe'
import { checkRateLimit } from '@/lib/rate-limit'

const plans = new Set(Object.keys(billingOffers))

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, 'checkout')
  if (limited) return limited

  try {
    const body = await req.json()
    const plan = body.plan as BillingPlan
    if (!plans.has(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const session = await getServerSession(authOptions)
    const checkout = await createPlanCheckout({
      plan,
      email: session?.user?.email,
      name: session?.user?.name,
      userId: (session?.user as any)?.id,
    })

    if (!checkout.url) {
      return NextResponse.json({ error: 'Unable to create checkout' }, { status: 500 })
    }

    return NextResponse.json({ url: checkout.url })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Checkout failed' }, { status: 500 })
  }
}
