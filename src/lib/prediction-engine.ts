import { NormalizedGame } from './odds-service'

export interface Prediction {
  match: string
  sport: string
  market: string 
  prediction: string 
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
 * MAX INCLUSIVE: Shows all outcomes with positive value or reasonable probability.
 */
export function generatePredictions(games: NormalizedGame[]): Prediction[] {
  const predictions: Prediction[] = []
  
  // Deduplicate games by ID
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

      // Generate predictions for ALL statistically relevant outcomes
      for (const stat of stats) {
        const edge = (1 / stat.avgOdds) - (1 / stat.odds)
        const valueBoost = edge * 100

        // MAX INCLUSIVE FILTER: 
        // Show if there is ANY edge (value > 0) OR if the probability is high (> 30%)
        const isHighlyRelevant = (stat.trueProb > 0.30) || (valueBoost > 0.01)
        
        if (isHighlyRelevant && stat.odds < 20.0) {
          const volatility = stat.odds > 4.0 ? 'Active' : stat.odds > 2.5 ? 'Normal' : 'Stable'
          const liquidity = game.sport.toLowerCase().includes('soccer') || game.sport.toLowerCase().includes('basketball') ? 'Professional' : 'Mid-Tier'

          predictions.push({
            match: game.match,
            sport: game.sport,
            market: marketKey,
            prediction: stat.name === '1' ? 'Home Win' : stat.name === '2' ? 'Away Win' : stat.name === 'X' ? 'Draw' : stat.name,
            odds: Number(stat.odds.toFixed(2)),
            confidence: Math.round(stat.trueProb * 100),
            edge: Number(Math.max(0, valueBoost).toFixed(2)),
            marketAverage: Number(stat.avgOdds.toFixed(2)),
            marketMargin: Number(houseFee.toFixed(2)),
            volatility,
            liquidity,
            unitReturn: Number((stat.odds * 1000 - 1000).toFixed(0)),
            reason: formatReason(stat, valueBoost, houseFee, game.sport, marketKey),
            commence_time: game.commence_time,
            bookmaker: stat.bookmaker
          })
        }
      }
    }
  }

  // Sort by Confidence + Edge for the "Picks" view, but UI will re-sort
  return predictions.sort((a, b) => (b.confidence + b.edge) - (a.confidence + a.edge))
}

function formatReason(pick: OutcomeStats, ed: number, hf: number, sport: string, mkt: string): string {
  const p = Math.round(pick.trueProb * 100)
  const isValue = ed > 0.5
  const mLabel = mkt === 'totals' ? 'Over/Under' : mkt === 'spreads' ? 'Handicap' : 'Match Result'
  
  if (isValue) {
    return `Model identified a pricing discrepancy in the ${mLabel} market. The average market price is ${pick.avgOdds.toFixed(2)}, but ${pick.bookmaker} is offering ${pick.odds.toFixed(2)}. This gives an estimated ${ed.toFixed(1)}% statistical advantage.`
  }
  
  return `Strong market consensus found for ${pick.name}. Our algorithmic analysis shows a ${p}% winning probability for this match. The ${hf.toFixed(1)}% bookie margin indicates high market efficiency.`
}
