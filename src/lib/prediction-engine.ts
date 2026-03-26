import { NormalizedGame } from './odds-service'

export interface Prediction {
  match: string
  sport: string
  market: string
  prediction: string
  odds: number
  confidence: number
  edge: number // % advantage vs implied market odds
  marketAverage: number
  marketMargin: number // % bookmaker vig/take
  reason: string
  commence_time: string
  bookmaker: string
}

interface OutcomeStats {
  name: string
  odds: number
  bookmaker: string
  impliedProb: number
  avgOdds: number
  trueProb: number
}

/**
 * Derives predictions from normalized odds data with enriched statistical markers.
 */
export function generatePredictions(games: NormalizedGame[]): Prediction[] {
  const predictions: Prediction[] = []

  for (const game of games) {
    if (!game.bookmakers || game.bookmakers.length === 0) continue

    // Collect all odds per outcome to calculate averages
    const allOddsMap: Record<string, number[]> = {}
    const bestOddsMap: Record<string, { odds: number; bookmaker: string }> = {}

    for (const bookie of game.bookmakers) {
      for (const market of bookie.markets) {
        if (market.key !== 'h2h') continue
        for (const outcome of market.outcomes) {
          if (!allOddsMap[outcome.name]) allOddsMap[outcome.name] = []
          allOddsMap[outcome.name].push(outcome.odds)

          if (!bestOddsMap[outcome.name] || outcome.odds > bestOddsMap[outcome.name].odds) {
            bestOddsMap[outcome.name] = { odds: outcome.odds, bookmaker: outcome.bookmaker }
          }
        }
      }
    }

    const outcomeNames = Object.keys(bestOddsMap)
    if (outcomeNames.length < 2) continue

    // Calculate market-wide stats
    const outcomes: OutcomeStats[] = outcomeNames.map(name => {
      const best = bestOddsMap[name]
      const avg = allOddsMap[name].reduce((a, b) => a + b, 0) / allOddsMap[name].length
      return {
        name,
        odds: best.odds,
        bookmaker: best.bookmaker,
        avgOdds: avg,
        impliedProb: 1 / best.odds,
        trueProb: 0 // Will be set below
      }
    })

    const totalImplied = outcomes.reduce((sum, o) => sum + o.impliedProb, 0)
    const marketMargin = Math.max(0, (totalImplied - 1) * 100)

    // Normalize to get "true" probability (consensus probability)
    outcomes.forEach(o => { o.trueProb = o.impliedProb / totalImplied })

    // Find the best "Value" or "Confidence" pick
    // Strategy: Choose most likely non-draw, or a high-value underdog if edge is huge
    const favourite = outcomes
      .filter(o => o.name !== 'Draw')
      .sort((a, b) => b.trueProb - a.trueProb)[0]

    if (!favourite) continue

    // High Odds Support: We only suggest high odds if there's a significant "Edge" vs average market
    const edge = (1 / favourite.avgOdds) - (1 / favourite.odds)
    const edgePercent = Math.max(0, edge * 100)

    // Thresholds: (Confidence > 50% AND odds < 3.5) OR (Heavy edge > 5% on an underdog)
    const isHighValueUnderdog = favourite.odds > 3.0 && edgePercent > 5.0
    const isSolidFavourite = favourite.trueProb > 0.55 && favourite.odds < 2.5

    if (!isHighValueUnderdog && !isSolidFavourite) continue

    const confidence = Math.round(favourite.trueProb * 100)
    const reason = buildReason(favourite, edgePercent, marketMargin, game.sport)

    predictions.push({
      match: game.match,
      sport: game.sport,
      market: 'h2h',
      prediction: favourite.name,
      odds: Number(favourite.odds.toFixed(2)),
      confidence,
      edge: Number(edgePercent.toFixed(2)),
      marketAverage: Number(favourite.avgOdds.toFixed(2)),
      marketMargin: Number(marketMargin.toFixed(2)),
      reason,
      commence_time: game.commence_time,
      bookmaker: favourite.bookmaker,
    })
  }

  return predictions.sort((a, b) => b.confidence - a.confidence)
}

function buildReason(
  fav: OutcomeStats,
  edge: number,
  margin: number,
  sport: string
): string {
  const prob = Math.round(fav.trueProb * 100)
  
  if (edge > 4.0) {
    return `Statistical Value Detected: ${fav.bookmaker} offers odds of ${fav.odds.toFixed(2)}, which is significantly higher than the market average of ${fav.avgOdds.toFixed(2)}. This represents a ${edge.toFixed(1)}% mathematical edge over the bookmaker house edge.`
  }
  
  if (prob >= 75) {
    return `Heavy System Backing: ${fav.name} carries a dominant ${prob}% probability consensus. With a low bookie margin of ${margin.toFixed(1)}%, the returns for ${sport} are optimized for high-volume banking.`
  }

  return `${fav.name} is the clear favourite with ${prob}% probability. Market average is ${fav.avgOdds.toFixed(2)}, making ${fav.bookmaker}'s price of ${fav.odds.toFixed(2)} the top-tier entry point.`
}
