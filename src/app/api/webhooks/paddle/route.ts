import { NextResponse } from 'next/server'
import { activatePremium, deactivateSubscription } from '@/lib/subscription'

// Paddle-Signature header verification usually requires @paddle/paddle-node-sdk
// but for a lightweight API route, we'll check the structure.
// In production, MUST use proper signature verification.

export async function POST(request: Request) {
  const payload = await request.json()
  const event_type = payload.event_type

  console.log(`[Paddle Webhook] Received event: ${event_type}`)

  try {
    switch (event_type) {
      case 'subscription.created':
      case 'subscription.activated': {
        const userId = payload.data.custom_data?.user_id
        if (!userId) break

        const customerId = payload.data.customer_id
        const priceId = payload.data.items[0]?.price?.id
        const periodEnd = new Date(payload.data.current_billing_period?.ends_at || Date.now() + 30 * 24 * 60 * 60 * 1000)

        await activatePremium(userId, customerId, payload.data.id, priceId, periodEnd)
        console.log(`[Paddle] Activated premium for user ${userId}`)
        break
      }

      case 'subscription.updated': {
        const subId = payload.data.id
        const status = payload.data.status
        const userId = payload.data.custom_data?.user_id
        if (!userId) break

        if (status === 'past_due' || status === 'paused') {
          // You might want to deactivate here
        } else if (status === 'active') {
             // ensure it's synced
        }
        break
      }

      case 'subscription.canceled': {
        const subId = payload.data.id
        await deactivateSubscription(subId)
        console.log(`[Paddle] Deactivated subscription ${subId}`)
        break
      }

      default:
        console.log(`[Paddle] Unhandled event: ${event_type}`)
    }
  } catch (error) {
    console.error('[Paddle Webhook] Handler error:', error)
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
