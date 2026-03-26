import { NormalizedGame } from './odds-service'

export interface Prediction {
  match: string
  sport: string
  market: string
  prediction: string
  odds: number
  confidence: number
  reason: string
  commence_time: string
  bookmaker: string
}

interface BestOutcome {
  name: string
  odds: number
  bookmaker: string
}

/**
 * Derives predictions from normalized odds data.
 * Strategy: find the outcome with the highest implied probability (lowest odds)
 * that still represents a "value bet" — where our estimated probability
 * exceeds the market's implied probability by a meaningful margin.
 */
export function generatePredictions(games: NormalizedGame[]): Prediction[] {
  const predictions: Prediction[] = []

  for (const game of games) {
    if (!game.bookmakers || game.bookmakers.length === 0) continue

    // Collect best (highest) odds per outcome name across all bookmakers
    const bestOddsMap: Record<string, BestOutcome> = {}
    for (const bookie of game.bookmakers) {
      for (const market of bookie.markets) {
        if (market.key !== 'h2h') continue
        for (const outcome of market.outcomes) {
          if (!bestOddsMap[outcome.name] || outcome.odds > bestOddsMap[outcome.name].odds) {
            bestOddsMap[outcome.name] = { name: outcome.name, odds: outcome.odds, bookmaker: outcome.bookmaker }
          }
        }
      }
    }

    const outcomes = Object.values(bestOddsMap)
    if (outcomes.length < 2) continue

    // Implied probability for each outcome (using best available odds)
    const withImplied = outcomes.map(o => ({ ...o, impliedProb: 1 / o.odds }))

    // The total market overround
    const overround = withImplied.reduce((sum, o) => sum + o.impliedProb, 0)

    // Normalize to get "true" probability estimate
    const withTrueProb = withImplied.map(o => ({ ...o, trueProb: o.impliedProb / overround }))

    // Find the single most likely non-Draw outcome (highest true probability)
    const favourite = withTrueProb
      .filter(o => o.name !== 'Draw')
      .sort((a, b) => b.trueProb - a.trueProb)[0]

    if (!favourite) continue

    // Only suggest if market odds are under 3.0 (somewhat favoured) and confidence is meaningful
    if (favourite.odds > 3.0) continue

    // Confidence: how strongly the market favours this outcome (scaled 0–100)
    const confidence = Math.round(favourite.trueProb * 100)
    if (confidence < 50) continue // Skip coin-flip outcomes

    // Build a human-readable reason
    const reason = buildReason(favourite, overround, game.sport)

    predictions.push({
      match: game.match,
      sport: game.sport,
      market: 'h2h',
      prediction: favourite.name,
      odds: Number(favourite.odds.toFixed(2)),
      confidence,
      reason,
      commence_time: game.commence_time,
      bookmaker: favourite.bookmaker,
    })
  }

  // Sort by confidence descending
  return predictions.sort((a, b) => b.confidence - a.confidence)
}

function buildReason(
  favourite: { name: string; odds: number; trueProb: number; bookmaker: string },
  overround: number,
  sport: string
): string {
  const prob = Math.round(favourite.trueProb * 100)
  const margin = Math.round((overround - 1) * 100 * 10) / 10

  if (prob >= 75) {
    return `${favourite.name} is a heavy favourite with a ${prob}% implied win probability at odds of ${favourite.odds.toFixed(2)}. Market is pricing this as a near-certain outcome.`
  }
  if (prob >= 65) {
    return `${favourite.name} has strong market backing at ${prob}% probability. The ${sport} odds of ${favourite.odds.toFixed(2)} via ${favourite.bookmaker} offer solid value.`
  }
  return `${favourite.name} edges out as the most likely winner at a ${prob}% implied probability. Bookmaker margin is ${margin}% — a relatively fair market.`
}
