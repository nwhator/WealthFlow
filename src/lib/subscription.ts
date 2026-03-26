import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type UserPlan = 'free' | 'premium'

export interface Subscription {
  plan: UserPlan
  status: string
  current_period_end: string | null
  paddle_customer_id: string | null
}

/**
 * Fetch the current user's subscription, defaulting to free if none exists.
 */
export async function getSubscription(userId?: string): Promise<Subscription> {
  if (!userId) {
    return { plan: 'free', status: 'none', current_period_end: null, paddle_customer_id: null }
  }
  const supabase = await createClient()
  const { data } = await supabase
    .from('subscriptions')
    .select('plan, status, current_period_end, paddle_customer_id')
    .eq('user_id', userId)
    .single()

  if (!data || data.status === 'cancelled' || data.status === 'inactive') {
    return { plan: 'free', status: data?.status ?? 'none', current_period_end: null, paddle_customer_id: null }
  }

  return {
      plan: data.plan as UserPlan,
      status: data.status,
      current_period_end: data.current_period_end,
      paddle_customer_id: data.paddle_customer_id
  }
}

/**
 * Returns the user's plan ('free' | 'premium'). Defaults to 'free'.
 */
export async function getUserPlan(userId: string): Promise<UserPlan> {
  const sub = await getSubscription(userId)
  return sub.plan as UserPlan
}

/**
 * Server-side guard. Redirects to /pricing if user is not on premium plan.
 */
export async function requirePremium(userId: string): Promise<void> {
  const plan = await getUserPlan(userId)
  if (plan !== 'premium') {
    redirect('/pricing')
  }
}

/**
 * Upsert a subscription to 'premium' after successful Paddle payment.
 */
export async function activatePremium(
  userId: string,
  customerId: string,
  subscriptionId: string,
  priceId: string,
  periodEnd: Date
) {
  const supabase = await createClient()
  const { error } = await supabase
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

  if (error) throw new Error(`Failed to activate premium: ${error.message}`)
}

/**
 * Cancel/deactivate a subscription.
 */
export async function deactivateSubscription(subscriptionId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'cancelled', plan: 'free', updated_at: new Date().toISOString() })
    .eq('paddle_subscription_id', subscriptionId)

  if (error) throw new Error(`Failed to deactivate subscription: ${error.message}`)
}
