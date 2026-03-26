import { createClient } from '@/lib/supabase/server'
import { getNormalizedOdds } from '@/lib/odds-service'
import { calculateArbitrage } from '@/lib/arbitrage-utils'
import { generatePredictions } from '@/lib/prediction-engine'
import { Outcome } from '@/lib/arbitrage-utils'

export async function runFullDataRefresh() {
  const supabase = await createClient()
  console.log('[Cron-Logic] Starting refresh...')
  
  const games = await getNormalizedOdds()
  console.log(`[Cron-Logic] Fetched ${games.length} games`)

  // 1. Predictions Cache
  const predictions = generatePredictions(games)
  await supabase.from('predictions_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  if (predictions.length > 0) {
    await supabase.from('predictions_cache').insert(
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
  }

  // 2. Arbitrage Cache
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
          stake_distribution: op.stakeDistribution || [],
          outcomes: op.outcomes,
        })
      }
    }
  }

  await supabase.from('arbitrage_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  if (arbitrageOpps.length > 0) {
    await supabase.from('arbitrage_cache').insert(arbitrageOpps)
  }

  return {
    predictions: predictions.length,
    arbitrage: arbitrageOpps.length,
    timestamp: new Date().toISOString(),
  }
}
