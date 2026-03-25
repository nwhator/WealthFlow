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

    // Suggesting stakes using basic fractional bankroll management safely mapped
    const calcSuggestedStake = (odds: number) => {
      if (bankroll <= 0) return 0;
      if (odds < 1.3) return bankroll * 0.05 // 5% for very safe
      if (odds < 1.6) return bankroll * 0.03 // 3% for safe
      if (odds < 2.0) return bankroll * 0.02 // 2% for moderate
      return bankroll * 0.005 // 0.5% for risky
    }

    const suggestions = []
    
    // Evaluate upcoming matches across globally scanned bookmakers
    for (const game of games) {
      if (!game.bookmakers || game.bookmakers.length === 0) continue;
      
      let lowestOverallOdds = 999;
      let favoredTeam = "";

      // Step 1: Determine the heavy favorite across the market safely
      const firstH2H = game.bookmakers[0]?.markets.find((m: {key: string; outcomes: {name: string, price: number}[]}) => m.key === 'h2h');
      if (!firstH2H) continue;
      for (const out of firstH2H.outcomes) {
         if (out.name !== 'Draw' && out.price < lowestOverallOdds) {
             lowestOverallOdds = out.price;
             favoredTeam = out.name;
         }
      }

      // Step 2: Now find the BEST price for that safe favoredTeam across ALL bookies to maximize value
      let bestPriceForFavored = 0;
      let bestBookieTitle = "";

      for (const bookie of game.bookmakers) {
        const h2h = bookie.markets.find((m: {key: string; outcomes: {name: string, price: number}[]}) => m.key === 'h2h');
        if (!h2h) continue;
        const out = h2h.outcomes.find((o: {name: string, price: number}) => o.name === favoredTeam);
        if (out && out.price > bestPriceForFavored) {
           bestPriceForFavored = out.price;
           bestBookieTitle = bookie.title;
        }
      }

      // ONLY suggest safe bets where the absolute best odds are solidly probable (e.g., less than 2.00)
      if (bestPriceForFavored === 0 || bestPriceForFavored >= 2.0) continue; 

      // Calculate exact risk % profile based on Implied probability
      const impliedProb = 1 / bestPriceForFavored;
      const riskPercent = (1 - impliedProb) * 100;
      
      let riskLabel = 'Low Risk';
      if (bestPriceForFavored < 1.3) riskLabel = 'Extremely Safe';
      else if (bestPriceForFavored < 1.5) riskLabel = 'Very Safe';
      else if (bestPriceForFavored < 1.7) riskLabel = 'Safe';
      else if (bestPriceForFavored < 2.0) riskLabel = 'Moderate Risk';

      suggestions.push({
        id: game.id,
        match: `${game.home_team} vs ${game.away_team}`,
        commence_time: game.commence_time,
        sport: game.sport_title,
        favoredTeam: favoredTeam,
        odds: bestPriceForFavored,
        bookmaker: bestBookieTitle,
        riskLabel: riskLabel,
        riskPercent: riskPercent,
        suggestedStake: calcSuggestedStake(bestPriceForFavored),
      })
    }

    // Sort priority logic strictly by Safest Games (lowest risk %)
    suggestions.sort((a, b) => a.riskPercent - b.riskPercent)

    // Return as many options as safely possible (up to 30)
    return NextResponse.json(suggestions.slice(0, 30));
  } catch (error) {
    console.error(error)
    return NextResponse.json([])
  }
}
