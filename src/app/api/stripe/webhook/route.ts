import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db } from '@/lib/db'
import { billingOfferFromPrice, billingPlanFromPrice, stripeClient } from '@/lib/stripe'

function periodEnd(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0]
  const value = item?.current_period_end || subscription.ended_at || subscription.trial_end
  return value ? new Date(value * 1000) : null
}

function subscriptionStatus(status?: Stripe.Subscription.Status | null) {
  if (!status) return 'active'
  if (status === 'canceled') return 'cancelled'
  return status
}

function sessionEmail(session: Stripe.Checkout.Session) {
  return session.customer_details?.email || session.customer_email || undefined
}

async function findUser(userId?: string | null, email?: string | null) {
  if (userId) {
    const user = await db.user.findUnique({ where: { id: userId } })
    if (user) return user
  }

  if (email) {
    return db.user.findUnique({ where: { email } })
  }

  return null
}

async function upsertSubscription(subscription: Stripe.Subscription, fallback?: Stripe.Checkout.Session) {
  const item = subscription.items.data[0]
  const priceId = item?.price?.id
  const metadata = { ...subscription.metadata, ...(fallback?.metadata || {}) }
  const email = fallback ? sessionEmail(fallback) : undefined
  const user = await findUser(metadata.user_id, email)

  if (!user) {
    return { ignored: 'user_not_found' }
  }

  await db.subscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    create: {
      userId: user.id,
      plan: billingPlanFromPrice(priceId),
      status: subscriptionStatus(subscription.status),
      stripeCustomerId: subscription.customer?.toString(),
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      currentPeriodEnd: periodEnd(subscription),
    },
    update: {
      plan: billingPlanFromPrice(priceId),
      status: subscriptionStatus(subscription.status),
      stripeCustomerId: subscription.customer?.toString(),
      stripePriceId: priceId,
      currentPeriodEnd: periodEnd(subscription),
    },
  })

  return { ok: true }
}

async function upsertPurchase(session: Stripe.Checkout.Session) {
  const priceId = session.line_items?.data[0]?.price?.id
  const offer = billingOfferFromPrice(priceId)
  if (!offer || offer.kind === 'subscription') {
    return { ignored: 'non_purchase_offer' }
  }

  const email = sessionEmail(session)
  const user = await findUser(session.metadata?.user_id, email)

  await db.purchase.upsert({
    where: { stripeSessionId: session.id },
    create: {
      userId: user?.id,
      email,
      plan: offer.plan,
      offerKind: offer.kind,
      status: session.payment_status || 'paid',
      monitorLimit: offer.monitorLimit,
      stripeSessionId: session.id,
      stripeCustomerId: session.customer?.toString(),
      stripePriceId: priceId,
      stripePaymentIntentId: session.payment_intent?.toString(),
      amountCents: session.amount_total,
      currency: session.currency?.toUpperCase(),
      purchasedAt: new Date((session.created || Math.floor(Date.now() / 1000)) * 1000),
    },
    update: {
      userId: user?.id,
      email,
      plan: offer.plan,
      offerKind: offer.kind,
      status: session.payment_status || 'paid',
      monitorLimit: offer.monitorLimit,
      stripeCustomerId: session.customer?.toString(),
      stripePriceId: priceId,
      stripePaymentIntentId: session.payment_intent?.toString(),
      amountCents: session.amount_total,
      currency: session.currency?.toUpperCase(),
    },
  })

  return { ok: true }
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Stripe webhook is not configured' }, { status: 500 })
  }

  const stripe = stripeClient()
  const rawBody = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid Stripe signature' }, { status: 401 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = await stripe.checkout.sessions.retrieve((event.data.object as Stripe.Checkout.Session).id, {
      expand: ['line_items.data.price'],
    })

    if (session.mode === 'subscription' && session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(session.subscription.toString())
      await upsertSubscription(subscription, session)
    } else if (session.mode === 'payment') {
      await upsertPurchase(session)
    }

    return NextResponse.json({ ok: true })
  }

  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  ) {
    await upsertSubscription(event.data.object as Stripe.Subscription)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ ok: true, ignored: event.type })
}
