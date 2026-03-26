import { createClient } from '@/lib/supabase/server'
import { getNormalizedOdds } from '@/lib/odds-service'
import { calculateArbitrage } from '@/lib/arbitrage-utils'
import { generatePredictions } from '@/lib/prediction-engine'
import { Outcome } from '@/lib/arbitrage-utils'

export async function runFullDataRefresh() {
  const supabase = await createClient()
  console.log('[Cron-Logic] Starting robust refresh...')
  
  const games = await getNormalizedOdds()
  if (!games || games.length === 0) {
    console.warn('[Cron-Logic] API returned 0 games. Aborting to preserve cache.')
    return { error: 'Empty API response', timestamp: new Date().toISOString() }
  }
  console.log(`[Cron-Logic] Fetched ${games.length} games`)

  const now = new Date()
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const thirtyDays = new Date(now)
  thirtyDays.setDate(now.getDate() + 30)

  const relevantGames = games.filter(g => {
    const d = new Date(g.commence_time)
    return d >= startOfToday && d <= thirtyDays
  })
  console.log(`[Cron-Logic] ${relevantGames.length} games within 30-day window`)

  // 1. Predictions Cache
  const predictions = generatePredictions(relevantGames)
  console.log(`[Cron-Logic] Generated ${predictions.length} predictions`)

  if (predictions.length > 0) {
    await supabase.from('predictions_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('predictions_cache').insert(
      predictions.map(p => ({
        match: p.match,
        sport: p.sport,
        market: p.market,
        prediction: p.prediction,
        odds: p.odds,
        confidence: p.confidence,
        reason: p.reason,
        edge: p.edge,
        market_average: p.marketAverage,
        market_margin: p.marketMargin,
        volatility: p.volatility,
        liquidity: p.liquidity,
        unit_return: p.unitReturn,
        commence_time: p.commence_time,
        bookmaker: p.bookmaker,
      }))
    )
  } else {
    console.warn('[Cron-Logic] 0 predictions generated. Keeping existing cache.')
  }

  // 2. Arbitrage Cache
  const arbitrageOpps = []
  const marketKeys = ['h2h', 'totals', 'spreads']

  for (const game of relevantGames) {
    if (!game.bookmakers || game.bookmakers.length === 0) continue

    for (const mKey of marketKeys) {
      const outcomesByName: Record<string, Outcome[]> = {}
      for (const bookie of game.bookmakers) {
        const mkt = bookie.markets.find(m => m.key === mKey)
        if (!mkt) continue
        for (const outcome of mkt.outcomes) {
          const label = mKey === 'h2h' ? outcome.name : `${outcome.name} ${outcome.point !== undefined ? (outcome.point > 0 ? '+' : '') + outcome.point : ''}`.trim()
          if (!outcomesByName[label]) outcomesByName[label] = []
          outcomesByName[label].push({ name: label, odds: outcome.odds, bookmaker: outcome.bookmaker })
        }
      }
      const labels = Object.keys(outcomesByName)
      if (labels.length < 2) continue
      const bestOutcomes: Outcome[] = labels.map(label =>
        outcomesByName[label].reduce((prev, curr) => curr.odds > prev.odds ? curr : prev)
      )
      if (bestOutcomes.length >= 2) {
        const op = calculateArbitrage(game.match, game.sport, mKey, bestOutcomes, 10000)
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
  }

  console.log(`[Cron-Logic] Found ${arbitrageOpps.length} arbitrage opportunities`)

  if (arbitrageOpps.length > 0) {
    await supabase.from('arbitrage_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('arbitrage_cache').insert(arbitrageOpps)
  } else {
    console.warn('[Cron-Logic] 0 arbitrage opps found. Keeping existing cache.')
  }

  return {
    predictions: predictions.length,
    arbitrage: arbitrageOpps.length,
    timestamp: new Date().toISOString(),
  }
}
