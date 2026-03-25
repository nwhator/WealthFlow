'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function bookmarkOpportunity(opportunity: {
  match: string,
  sport: string,
  market: string,
  arbitrage_percentage: number,
  profit_estimate: number,
  commence_time: string,
  details: Record<string, unknown>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('arbitrage_opportunities')
    .insert({
      user_id: user.id,
      match: opportunity.match,
      sport: opportunity.sport,
      market: opportunity.market,
      commence_time: opportunity.commence_time,
      arbitrage_percentage: opportunity.arbitrage_percentage,
      profit_estimate: opportunity.profit_estimate,
      details: opportunity.details,
      is_bookmarked: true
    })

  if (error) {
    console.error('Save failed:', error)
    return { error: error.message }
  }

  revalidatePath('/arbitrage')
  return { success: true }
}

export async function getSavedOpportunities() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('arbitrage_opportunities')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Fetch saved failed:', error)
    return { error: error.message }
  }

  return { data }
}
