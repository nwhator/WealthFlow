import { NextResponse } from 'next/server'
import { getNormalizedOdds } from '@/lib/odds-service'
import { calculateArbitrage } from '@/lib/arbitrage-utils'
import { generatePredictions } from '@/lib/prediction-engine'
import { createClient } from '@/lib/supabase/server'
import { Outcome } from '@/lib/arbitrage-utils'

export async function GET(request: Request) {
  // Protect with CRON_SECRET
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createClient()
    console.log('[Cron] Fetching normalized odds...')
    const games = await getNormalizedOdds()
    console.log(`[Cron] Fetched ${games.length} games`)

    // ── 1. Generate & cache predictions ─────────────────────────
    const predictions = generatePredictions(games)

    await supabase.from('predictions_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    if (predictions.length > 0) {
      const { error: predError } = await supabase.from('predictions_cache').insert(
        predictions.map(p => ({
          match: p.match,
          sport: p.sport,
          market: p.market,
          prediction: p.prediction,
          odds: p.odds,
          confidence: p.confidence,
          reason: p.reason,
          commence_time: p.commence_time,
          bookmaker: p.bookmaker,
        }))
      )
      if (predError) console.error('[Cron] Prediction insert error:', predError)
    }

    // ── 2. Generate & cache arbitrage opportunities ─────────────
    const arbitrageOpps = []
    for (const game of games) {
      if (!game.bookmakers || game.bookmakers.length === 0) continue

      const outcomesByName: Record<string, Outcome[]> = {}
      for (const bookie of game.bookmakers) {
        for (const market of bookie.markets) {
          if (market.key !== 'h2h') continue
          for (const outcome of market.outcomes) {
            if (!outcomesByName[outcome.name]) outcomesByName[outcome.name] = []
            outcomesByName[outcome.name].push(outcome)
          }
        }
      }

      const bestOutcomes: Outcome[] = Object.keys(outcomesByName).map(name =>
        outcomesByName[name].reduce((prev, curr) => curr.odds > prev.odds ? curr : prev)
      )

      if (bestOutcomes.length >= 2) {
        const op = calculateArbitrage(game.match, game.sport, 'h2h', bestOutcomes, 10000)
        if (op && op.arbitragePercentage > 0) {
          arbitrageOpps.push({
            match: op.match,
            sport: op.sport,
            market: op.market,
            commence_time: game.commence_time,
            arbitrage_percentage: op.arbitragePercentage,
            guaranteed_profit: op.guaranteedProfit,
            implied_prob: op.impliedProb,
            stake_distribution: op.stakeDistribution,
            outcomes: op.outcomes,
          })
        }
      }
    }

    await supabase.from('arbitrage_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    if (arbitrageOpps.length > 0) {
      const { error: arbError } = await supabase.from('arbitrage_cache').insert(arbitrageOpps)
      if (arbError) console.error('[Cron] Arbitrage insert error:', arbError)
    }

    return NextResponse.json({
      success: true,
      predictions: predictions.length,
      arbitrage: arbitrageOpps.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Cron] Fatal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
