import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { db } from '@/lib/db'
import { billingOfferFromVariant, billingPlanFromVariant } from '@/lib/lemonsqueezy'

function verifySignature(rawBody: string, signature: string | null) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET
  if (!secret || !signature) return false

  const digest = createHmac('sha256', secret).update(rawBody).digest('hex')
  const expected = Buffer.from(digest)
  const received = Buffer.from(signature)
  return expected.length === received.length && timingSafeEqual(expected, received)
}

function periodEnd(attributes: any) {
  const value = attributes?.renews_at || attributes?.ends_at || attributes?.trial_ends_at
  return value ? new Date(value) : null
}

function moneyToCents(value: unknown) {
  if (typeof value === 'number') return Number.isInteger(value) ? value : Math.round(value * 100)
  if (typeof value !== 'string' || !value.trim()) return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return null
  return Number.isInteger(parsed) ? parsed : Math.round(parsed * 100)
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  if (!verifySignature(rawBody, req.headers.get('x-signature'))) {
    return NextResponse.json({ error: 'Invalid Lemon Squeezy signature' }, { status: 401 })
  }

  const event = JSON.parse(rawBody)
  const eventName = event?.meta?.event_name
  const data = event?.data
  const attributes = data?.attributes || {}
  const custom = event?.meta?.custom_data || attributes?.first_subscription_item?.custom_data || {}

  const userId = custom.user_id || custom.userId
  const email = attributes.user_email || attributes.customer_email || attributes.email
  const user = userId
    ? await db.user.findUnique({ where: { id: userId } })
    : email
      ? await db.user.findUnique({ where: { email } })
      : null

  const variantId =
    attributes.variant_id ||
    attributes.first_subscription_item?.variant_id ||
    attributes.first_order_item?.variant_id ||
    custom.variant_id

  if (eventName?.startsWith('order_')) {
    const offer = billingOfferFromVariant(variantId)
    if (!offer || offer.kind === 'subscription') {
      return NextResponse.json({ ok: true, ignored: eventName || 'unknown' })
    }

    const orderId = data?.id?.toString()
    if (!orderId) {
      return NextResponse.json({ ok: true, ignored: 'missing_order_id' })
    }

    await db.purchase.upsert({
      where: { lsOrderId: orderId },
      create: {
        userId: user?.id,
        email,
        plan: offer.plan,
        offerKind: offer.kind,
        status: attributes.status || 'paid',
        monitorLimit: offer.monitorLimit,
        lsOrderId: orderId,
        lsCustomerId: attributes.customer_id?.toString(),
        lsVariantId: variantId?.toString(),
        amountCents: moneyToCents(attributes.total || attributes.total_usd || attributes.subtotal),
        currency: attributes.currency || attributes.currency_code || 'USD',
        purchasedAt: attributes.created_at ? new Date(attributes.created_at) : new Date(),
      },
      update: {
        userId: user?.id,
        email,
        plan: offer.plan,
        offerKind: offer.kind,
        status: attributes.status || 'paid',
        monitorLimit: offer.monitorLimit,
        lsCustomerId: attributes.customer_id?.toString(),
        lsVariantId: variantId?.toString(),
        amountCents: moneyToCents(attributes.total || attributes.total_usd || attributes.subtotal),
        currency: attributes.currency || attributes.currency_code || 'USD',
      },
    })

    return NextResponse.json({ ok: true })
  }

  if (!eventName?.startsWith('subscription_')) {
    return NextResponse.json({ ok: true, ignored: eventName || 'unknown' })
  }

  if (!user) {
    return NextResponse.json({ ok: true, ignored: 'user_not_found' })
  }

  await db.subscription.upsert({
    where: { lsSubscriptionId: String(data.id) },
    create: {
      userId: user.id,
      plan: billingPlanFromVariant(variantId),
      status: attributes.status || 'active',
      lsCustomerId: attributes.customer_id?.toString(),
      lsSubscriptionId: String(data.id),
      lsVariantId: variantId?.toString(),
      currentPeriodEnd: periodEnd(attributes),
    },
    update: {
      plan: billingPlanFromVariant(variantId),
      status: attributes.status || 'active',
      lsCustomerId: attributes.customer_id?.toString(),
      lsVariantId: variantId?.toString(),
      currentPeriodEnd: periodEnd(attributes),
    },
  })

  return NextResponse.json({ ok: true })
}
