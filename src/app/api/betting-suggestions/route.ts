import { NextResponse } from 'next/server';

export const revalidate = 60; // Cache for 60 seconds

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const bankroll = Number(searchParams.get('bankroll') || 0)
  
  const apiKey = '294be1105ed6a6629da4fb878ab371f7'
  
  try {
    const res = await fetch(`https://api.the-odds-api.com/v4/sports/upcoming/odds/?apiKey=${apiKey}&regions=eu,us,uk&markets=h2h`, { next: { revalidate: 60 } })
    if (!res.ok) throw new Error("Failed to fetch odds")
    const games = await res.json()

    // Suggesting stakes using basic fractional bankroll management
    const calcSuggestedStake = (odds: number, isArb: boolean) => {
      if (bankroll <= 0) return 0;
      if (isArb) return bankroll * 0.15 // 15% on sure bets (Arbitrage)
      if (odds < 1.5) return bankroll * 0.05 // 5% for very safe
      if (odds < 2.5) return bankroll * 0.03 // 3% for medium
      return bankroll * 0.01 // 1% for risky
    }

    const getRiskLevel = (odds: number, isArb: boolean) => {
      if (isArb) return '🔒 ARBITRAGE SUREBET'
      if (odds < 1.5) return 'Low Risk / Safer'
      if (odds < 2.5) return 'Medium Risk'
      return 'High Risk / Volatile'
    }

    const suggestions = []
    
    // Evaluate upcoming matches across globally scanned bookmakers
    for (const game of games) {
      if (!game.bookmakers || game.bookmakers.length === 0) continue;
      
      let bestHome = 0;
      let bestAway = 0;
      let bestDraw = 0;
      let hasDraw = false;

      // Find best odds globally mapping across bookmakers
      for (const bookie of game.bookmakers) {
        const h2h = bookie.markets.find((m: { key: string; outcomes: {name: string, price: number}[] }) => m.key === 'h2h');
        if (!h2h) continue;
        
        for (const outcome of h2h.outcomes) {
          if (outcome.name === game.home_team) bestHome = Math.max(bestHome, outcome.price)
          else if (outcome.name === game.away_team) bestAway = Math.max(bestAway, outcome.price)
          else if (outcome.name === 'Draw') {
            bestDraw = Math.max(bestDraw, outcome.price)
            hasDraw = true
          }
        }
      }

      if (bestHome === 0 || bestAway === 0) continue;

      // Arbitrage Math Calculation Formula (Implied Probability < 1.0)
      let impliedProb = (1 / bestHome) + (1 / bestAway)
      if (hasDraw && bestDraw > 0) impliedProb += (1 / bestDraw)
      
      const isArb = impliedProb < 1.0;

      // Pick the favorite (safest outcome) to suggest natively
      const bestOdds = Math.min(bestHome, bestAway)

      suggestions.push({
        id: game.id,
        match: `${game.home_team} vs ${game.away_team}`,
        odds: bestOdds,
        risk: getRiskLevel(bestOdds, isArb),
        suggestedStake: calcSuggestedStake(bestOdds, isArb),
        isArb
      })
    }

    // Sort priority logic: Arbs first, then lowest risk (lowest odds)
    suggestions.sort((a, b) => {
      if (a.isArb && !b.isArb) return -1
      if (!a.isArb && b.isArb) return 1
      return a.odds - b.odds
    })

    // Return the top 5 highest-valued suggestions
    return NextResponse.json(suggestions.slice(0, 5));
  } catch (error) {
    console.error(error)
    return NextResponse.json([{id: "error", match: "Live API Connection Issue", odds: 1.0, risk: "N/A", suggestedStake: 0}])
  }
}
