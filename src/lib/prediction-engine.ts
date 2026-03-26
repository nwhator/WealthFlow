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
 * TOTAL DE-RESTRICTION: Surfaces every single outcome available.
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
      const houseFee = Math.max(0.01, (overround - 1) * 100)
      stats.forEach(s => { s.trueProb = s.impliedProb / overround })

      // TOTAL DE-RESTRICTION: Surface EVERYTHING
      for (const stat of stats) {
        const edge = (1 / stat.avgOdds) - (1 / stat.odds)
        const valueBoost = edge * 100

        const volatility = stat.odds > 5.0 ? 'Active' : stat.odds > 3.0 ? 'Normal' : 'Stable'
        const liquidity = 'Standard'

        predictions.push({
          match: game.match,
          sport: game.sport,
          market: marketKey,
          prediction: stat.name === '1' ? 'Home Win' : stat.name === '2' ? 'Away Win' : stat.name === 'X' ? 'Draw' : stat.name,
          odds: Number(stat.odds.toFixed(2)),
          confidence: Math.round(stat.trueProb * 100),
          edge: Number(valueBoost.toFixed(2)),
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

  // Final sort to make it look organized in DB
  return predictions.sort((a, b) => new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime())
}

function formatReason(pick: OutcomeStats, ed: number, hf: number, sport: string, mkt: string): string {
  const p = Math.round(pick.trueProb * 100)
  const mLabel = mkt === 'totals' ? 'Over/Under' : mkt === 'spreads' ? 'Handicap' : 'Match Result'
  
  return `Model identified an entry in the ${mLabel} market for ${sport}. Analytical consensus indicates a ${p}% winning probability. ${ed > 0 ? `The market average is ${pick.avgOdds.toFixed(2)}, providing a +${ed.toFixed(1)}% price variance.` : `Bookmaker margin is sitting at ${hf.toFixed(1)}% for this specific outcome.`}`
}
