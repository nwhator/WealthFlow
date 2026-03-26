import { createClient } from '@/lib/supabase/server'

export type UserPlan = 'free' | 'premium'

export interface Subscription {
  plan: UserPlan
  status: string
  current_period_end: string | null
  paddle_customer_id: string | null
}

/**
 * FOR NOW: Always return premium to allow free access for all.
 */
export async function getSubscription(userId?: string): Promise<Subscription> {
  return { 
    plan: 'premium', 
    status: 'active', 
    current_period_end: '2099-01-01T00:00:00Z', 
    paddle_customer_id: null 
  }
}

/**
 * Always returns 'premium'.
 */
export async function getUserPlan(userId?: string): Promise<UserPlan> {
  return 'premium'
}

/**
 * No-op guard for now.
 */
export async function requirePremium(userId?: string): Promise<void> {
  return
}

export async function activatePremium(
  userId: string,
  customerId: string,
  subscriptionId: string,
  priceId: string,
  periodEnd: Date
) {
  // Logic preserved but effectively redundant while getSubscription returns premium
  const supabase = await createClient()
  await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      plan: 'premium',
      status: 'active',
      paddle_customer_id: customerId,
      paddle_subscription_id: subscriptionId,
      paddle_price_id: priceId,
      current_period_end: periodEnd.toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
}

export async function deactivateSubscription(subscriptionId: string) {
  const supabase = await createClient()
  await supabase
    .from('subscriptions')
    .update({ status: 'cancelled', plan: 'free', updated_at: new Date().toISOString() })
    .eq('paddle_subscription_id', subscriptionId)
}
