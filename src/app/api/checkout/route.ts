import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { createPlanCheckout, type BillingPlan } from '@/lib/lemonsqueezy'
import { checkRateLimit } from '@/lib/rate-limit'

const plans = new Set(['pro', 'business'])

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

    if (checkout.error || !checkout.data?.data?.attributes?.url) {
      return NextResponse.json(
        { error: checkout.error?.message || 'Unable to create checkout' },
        { status: checkout.statusCode || 500 },
      )
    }

    return NextResponse.json({ url: checkout.data.data.attributes.url })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Checkout failed' }, { status: 500 })
  }
}
