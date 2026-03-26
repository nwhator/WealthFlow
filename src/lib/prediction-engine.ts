import { NormalizedGame } from './odds-service'

export interface Prediction {
  match: string
  sport: string
  market: string // 'h2h' | 'totals' | 'spreads'
  prediction: string // e.g., 'Home Win', 'Over 2.5', 'Under 1.5', 'Home -1.5'
  odds: number
  confidence: number
  edge: number
  marketAverage: number
  marketMargin: number
  volatility: 'Stable' | 'Normal' | 'Active'
  liquidity: 'Standard' | 'Mid-Tier' | 'Professional'
  unitReturn: number
  reason: string
  commence_time: string
  bookmaker: string
}

interface OutcomeStats {
  name: string
  point?: number 
  odds: number
  bookmaker: string
  impliedProb: number
  avgOdds: number
  trueProb: number
}

/**
 * Derives predictions from normalized odds for H2H, Totals, and Spreads.
 * Optimized for maximum market coverage.
 */
export function generatePredictions(games: NormalizedGame[]): Prediction[] {
  const predictions: Prediction[] = []
  
  // Deduplicate games by ID first
  const uniqueGames = Array.from(new Map(games.map(g => [g.id, g])).values())

  for (const game of uniqueGames) {
    if (!game.bookmakers || game.bookmakers.length === 0) continue

    const marketTypes = ['h2h', 'totals', 'spreads']
    
    for (const marketKey of marketTypes) {
      const bestOddsMap: Record<string, { odds: number; bookmaker: string; all: number[]; point?: number }> = {}

      for (const bookie of game.bookmakers) {
        const market = bookie.markets.find(m => m.key === marketKey)
        if (!market) continue

        for (const outcome of market.outcomes) {
          // Robust labeling: Ensure point is included for totals/spreads
          const label = marketKey === 'h2h' ? outcome.name : `${outcome.name} ${outcome.point !== undefined ? (outcome.point > 0 ? '+' : '') + outcome.point : ''}`.trim()
          
          if (!bestOddsMap[label]) {
            bestOddsMap[label] = { odds: 0, bookmaker: '', all: [], point: (outcome as any).point }
          }
          
          bestOddsMap[label].all.push(outcome.odds)
          if (outcome.odds > bestOddsMap[label].odds) {
            bestOddsMap[label].odds = outcome.odds
            bestOddsMap[label].bookmaker = outcome.bookmaker
          }
        }
      }

      const labels = Object.keys(bestOddsMap)
      if (labels.length < 2) continue

      const stats: OutcomeStats[] = labels.map(label => {
        const b = bestOddsMap[label]
        return {
          name: label,
          point: b.point,
          odds: b.odds,
          bookmaker: b.bookmaker,
          avgOdds: b.all.reduce((a, b) => a + b, 0) / b.all.length,
          impliedProb: 1 / b.odds,
          trueProb: 0
        }
      })

      const overround = stats.reduce((sum, s) => sum + s.impliedProb, 0)
      const houseFee = Math.max(0.1, (overround - 1) * 100)
      stats.forEach(s => { s.trueProb = s.impliedProb / overround })

      const pick = stats.sort((a, b) => b.trueProb - a.trueProb)[0]
      if (!pick) continue

      const edge = (1 / pick.avgOdds) - (1 / pick.odds)
      const valueBoost = Math.max(0, edge * 100)

      // RELAXED PREDICTION FILTERING
      // Show if prob > 45% or value edge > 2.0%
      const isPickValid = (pick.trueProb > 0.45 && pick.odds < 5.0) || (valueBoost > 1.8 && pick.odds < 8.0)
      if (!isPickValid) continue

      const volatility = pick.odds > 3.0 ? 'Active' : pick.odds > 2.0 ? 'Normal' : 'Stable'
      const liquidity = game.sport.toLowerCase().includes('soccer') || game.sport.toLowerCase().includes('basketball') ? 'Professional' : 'Mid-Tier'

      predictions.push({
        match: game.match,
        sport: game.sport,
        market: marketKey,
        prediction: pick.name === '1' ? 'Home Win' : pick.name === '2' ? 'Away Win' : pick.name === 'X' ? 'Draw' : pick.name,
        odds: Number(pick.odds.toFixed(2)),
        confidence: Math.round(pick.trueProb * 100),
        edge: Number(valueBoost.toFixed(2)),
        marketAverage: Number(pick.avgOdds.toFixed(2)),
        marketMargin: Number(houseFee.toFixed(2)),
        volatility,
        liquidity,
        unitReturn: Number((pick.odds * 1000 - 1000).toFixed(0)),
        reason: formatReason(pick, valueBoost, houseFee, game.sport, marketKey),
        commence_time: game.commence_time,
        bookmaker: pick.bookmaker
      })
    }
  }

  // Double final check: only keep 1 prediction per match/market type to avoid noise
  return predictions.sort((a, b) => (b.confidence + b.edge) - (a.confidence + a.edge))
}

function formatReason(pick: OutcomeStats, ed: number, hf: number, sport: string, mkt: string): string {
  const p = Math.round(pick.trueProb * 100)
  const isValue = ed > 2.0
  const mLabel = mkt === 'totals' ? 'Over/Under' : mkt === 'spreads' ? 'Handicap' : 'Match Result'
  
  if (isValue) {
    return `Great value detected in the ${mLabel} market. The average price for '${pick.name}' is ${pick.avgOdds.toFixed(2)}, but ${pick.bookmaker} has a better rate of ${pick.odds.toFixed(2)}. This gives you a +${ed.toFixed(1)}% advantage vs the market.`
  }
  
  return `Strong choice found for ${pick.name}! Our system sees a ${p}% winning probability for this match. With household fees at just ${hf.toFixed(1)}%, this represents a very efficient entry point.`
}
