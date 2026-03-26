import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan } from '@/lib/subscription'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const plan = await getUserPlan(user?.id)
  if (plan !== 'premium') {
    return NextResponse.json({ isPremiumRequired: true }, { status: 200 })
  }

  const { searchParams } = new URL(request.url)
  const investment = Number(searchParams.get('investment') || '10000')

  // Serve from cache
  const { data: cached, error } = await supabase
    .from('arbitrage_cache')
    .select('*')
    .order('arbitrage_percentage', { ascending: false })

  if (error || !cached) {
    return NextResponse.json([], { status: 200 })
  }

  // Scale the stake distribution by the requested investment amount
  const scaled = cached.map(row => {
    const baseInvestment = 10000
    const ratio = investment / baseInvestment

    const stakeDistribution = Array.isArray(row.stake_distribution)
      ? row.stake_distribution.map((s: { name: string; odds: number; bookmaker: string; stake: number }) => ({
          name: s.name,
          odds: s.odds,
          bookmaker: s.bookmaker,
          stake: Number((s.stake * ratio).toFixed(2)),
        }))
      : []

    return {
      match: row.match,
      sport: row.sport,
      market: row.market,
      commence_time: row.commence_time,
      arbitragePercentage: Number(Number(row.arbitrage_percentage).toFixed(3)),
      guaranteedProfit: Number((Number(row.guaranteed_profit) * ratio).toFixed(2)),
      stakeDistribution,
    }
  })

  return NextResponse.json(scaled)
}
