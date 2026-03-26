import { NormalizedGame } from './odds-service'

export interface Prediction {
  match: string
  sport: string
  market: string
  prediction: string  // e.g. "Over 2.5", "Home Win", "Arsenal -1.5"
  line?: number       // numeric point e.g. 2.5 for totals/spreads
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

/** Converts API outcome name + point into a clean human-readable prediction label */
function buildLabel(name: string, point: number | undefined, marketKey: string): string {
  if (marketKey === 'h2h') {
    if (name === '1') return 'Home Win'
    if (name === '2') return 'Away Win'
    if (name === 'X') return 'Draw'
    return name
  }
  if (marketKey === 'totals') {
    // name is "Over" or "Under", point is the line e.g. 2.5
    if (point !== undefined) return `${name} ${Math.abs(point)}`
    return name
  }
  if (marketKey === 'spreads') {
    // name is the team name, point is the handicap e.g. -1.5
    if (point !== undefined) {
      const sign = point > 0 ? '+' : ''
      return `${name} ${sign}${point}`
    }
    return name
  }
  return name
}

/** Builds a unique dedup key from outcome name + point value for grouping across bookmakers */
function buildKey(name: string, point: number | undefined, marketKey: string): string {
  if (marketKey === 'totals' && point !== undefined) {
    return `${name}_${Math.abs(point)}`
  }
  if (marketKey === 'spreads' && point !== undefined) {
    return `${name}_${point}`
  }
  return name
}

/**
 * Derives predictions from normalized odds for H2H, Totals, and Spreads.
 */
export function generatePredictions(games: NormalizedGame[]): Prediction[] {
  const predictions: Prediction[] = []

  const uniqueGames = Array.from(new Map(games.map(g => [g.id, g])).values())

  for (const game of uniqueGames) {
    if (!game.bookmakers || game.bookmakers.length === 0) continue

    const marketTypes = ['h2h', 'totals', 'spreads']

    for (const marketKey of marketTypes) {
      // key → { best odds, bookmaker, all odds seen, point value }
      const bestOddsMap: Record<string, { odds: number; bookmaker: string; all: number[]; point?: number; label: string }> = {}

      for (const bookie of game.bookmakers) {
        const market = bookie.markets.find(m => m.key === marketKey)
        if (!market) continue

        for (const outcome of market.outcomes) {
          const rawPoint = (outcome as any).point as number | undefined
          const key = buildKey(outcome.name, rawPoint, marketKey)
          const label = buildLabel(outcome.name, rawPoint, marketKey)

          if (!bestOddsMap[key]) {
            bestOddsMap[key] = { odds: 0, bookmaker: '', all: [], point: rawPoint, label }
          }

          bestOddsMap[key].all.push(outcome.odds)
          if (outcome.odds > bestOddsMap[key].odds) {
            bestOddsMap[key].odds = outcome.odds
            bestOddsMap[key].bookmaker = outcome.bookmaker
          }
        }
      }

      const keys = Object.keys(bestOddsMap)
      if (keys.length < 2) continue

      const stats: OutcomeStats[] = keys.map(key => {
        const b = bestOddsMap[key]
        return {
          name: b.label,
          point: b.point,
          odds: b.odds,
          bookmaker: b.bookmaker,
          avgOdds: b.all.reduce((a, x) => a + x, 0) / b.all.length,
          impliedProb: 1 / b.odds,
          trueProb: 0,
        }
      })

      const overround = stats.reduce((sum, s) => sum + s.impliedProb, 0)
      const houseFee = Math.max(0.01, (overround - 1) * 100)
      stats.forEach(s => { s.trueProb = s.impliedProb / overround })

      for (const stat of stats) {
        const edge = (1 / stat.avgOdds) - (1 / stat.odds)
        const valueBoost = edge * 100
        const volatility = stat.odds > 5.0 ? 'Active' : stat.odds > 3.0 ? 'Normal' : 'Stable'

        predictions.push({
          match: game.match,
          sport: game.sport,
          market: marketKey,
          prediction: stat.name,
          line: stat.point,
          odds: Number(stat.odds.toFixed(2)),
          confidence: Math.round(stat.trueProb * 100),
          edge: Number(valueBoost.toFixed(2)),
          marketAverage: Number(stat.avgOdds.toFixed(2)),
          marketMargin: Number(houseFee.toFixed(2)),
          volatility,
          liquidity: 'Standard',
          unitReturn: Number((stat.odds * 1000 - 1000).toFixed(0)),
          reason: formatReason(stat, valueBoost, houseFee, game.sport, marketKey),
          commence_time: game.commence_time,
          bookmaker: stat.bookmaker,
        })
      }
    }
  }

  return predictions.sort((a, b) => new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime())
}

function formatReason(pick: OutcomeStats, ed: number, hf: number, sport: string, mkt: string): string {
  const p = Math.round(pick.trueProb * 100)
  const mLabel = mkt === 'totals'
    ? `Over/Under${pick.point !== undefined ? ' ' + Math.abs(pick.point) : ''}`
    : mkt === 'spreads'
    ? `Handicap${pick.point !== undefined ? ' (' + (pick.point > 0 ? '+' : '') + pick.point + ')' : ''}`
    : 'Match Result'

  return `Model identified an entry in the ${mLabel} market for ${sport}. Analytical consensus indicates a ${p}% winning probability. ${ed > 0 ? `The market average is ${pick.avgOdds.toFixed(2)}, providing a +${ed.toFixed(1)}% price variance.` : `Bookmaker margin is at ${hf.toFixed(1)}% for this outcome.`}`
}
