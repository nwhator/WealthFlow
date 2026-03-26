import { createClient } from '@/lib/supabase/server'
import { getNormalizedOdds } from '@/lib/odds-service'
import { calculateArbitrage } from '@/lib/arbitrage-utils'
import { generatePredictions } from '@/lib/prediction-engine'
import { Outcome } from '@/lib/arbitrage-utils'

const REFRESH_INTERVAL_HOURS = 48

export async function runFullDataRefresh() {
  const supabase = await createClient()
  console.log('[Cron-Logic] Starting refresh check...')

  // ── 48-hour guard ─────────────────────────────────────────────
  const { data: latestRow } = await supabase
    .from('predictions_cache')
    .select('fetched_at')
    .order('fetched_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latestRow?.fetched_at) {
    const lastFetch = new Date(latestRow.fetched_at)
    const hoursSince = (Date.now() - lastFetch.getTime()) / (1000 * 60 * 60)
    if (hoursSince < REFRESH_INTERVAL_HOURS) {
      const nextUpdate = new Date(lastFetch.getTime() + REFRESH_INTERVAL_HOURS * 60 * 60 * 1000)
      console.log(`[Cron-Logic] Data is fresh (${hoursSince.toFixed(1)}h old). Skipping API call.`)
      return {
        skipped: true,
        reason: 'Data is still fresh',
        lastUpdated: lastFetch.toISOString(),
        nextUpdate: nextUpdate.toISOString(),
      }
    }
  }

  console.log('[Cron-Logic] Data is stale. Fetching from API...')
  const games = await getNormalizedOdds()
  if (!games || games.length === 0) {
    console.warn('[Cron-Logic] API returned 0 games. Nothing to process.')
    return { error: 'Empty API response', timestamp: new Date().toISOString() }
  }
  console.log(`[Cron-Logic] Fetched ${games.length} total games`)

  // NO DATE FILTERING — process all games
  const relevantGames = games

  // 1. Predictions Cache
  const predictions = generatePredictions(relevantGames)
  console.log(`[Cron-Logic] Generated ${predictions.length} predictions`)

  if (predictions.length > 0) {
    await supabase.from('predictions_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    const { error: insErr } = await supabase.from('predictions_cache').insert(
      predictions.map(p => ({
        match: p.match,
        sport: p.sport,
        market: p.market,
        prediction: p.prediction,
        line: p.line ?? null,
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
    if (insErr) console.error('[Cron-Logic] Predictions insert error:', insErr)
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
          const label = mKey === 'h2h'
            ? outcome.name
            : `${outcome.name} ${outcome.point !== undefined ? (outcome.point > 0 ? '+' : '') + outcome.point : ''}`.trim()
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
    const { error: arbErr } = await supabase.from('arbitrage_cache').insert(arbitrageOpps)
    if (arbErr) console.error('[Cron-Logic] Arbitrage insert error:', arbErr)
  }

  const now = new Date()
  return {
    predictions: predictions.length,
    arbitrage: arbitrageOpps.length,
    lastUpdated: now.toISOString(),
    nextUpdate: new Date(now.getTime() + REFRESH_INTERVAL_HOURS * 60 * 60 * 1000).toISOString(),
  }
}

/** Returns cache metadata without touching the API */
export async function getCacheStatus() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('predictions_cache')
    .select('fetched_at')
    .order('fetched_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data?.fetched_at) return { lastUpdated: null, nextUpdate: null, isStale: true }

  const lastUpdated = new Date(data.fetched_at)
  const nextUpdate = new Date(lastUpdated.getTime() + REFRESH_INTERVAL_HOURS * 60 * 60 * 1000)
  const isStale = Date.now() > nextUpdate.getTime()

  return {
    lastUpdated: lastUpdated.toISOString(),
    nextUpdate: nextUpdate.toISOString(),
    isStale,
  }
}
