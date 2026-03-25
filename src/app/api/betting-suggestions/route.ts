import { NextResponse } from 'next/server';
import { calculateSafeScore } from '@/lib/sports-stats';

export const revalidate = 60; // Cache for 60 seconds

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const bankroll = Number(searchParams.get('bankroll') || 0)
  
  const apiKey = process.env.ODDS_API_KEY
  
  try {
    // Fetch from highly predictable, statistically skewed global niche markets (College basketball mismatches, MMA, Cricket, Euroleague)
    const endpoints = [
       `https://api.the-odds-api.com/v4/sports/upcoming/odds/?apiKey=${apiKey}&regions=eu,uk&markets=h2h`,
       `https://api.the-odds-api.com/v4/sports/soccer_epl/odds/?apiKey=${apiKey}&regions=eu,uk&markets=h2h`,
       `https://api.the-odds-api.com/v4/sports/basketball_nba/odds/?apiKey=${apiKey}&regions=us,uk&markets=h2h`,
       `https://api.the-odds-api.com/v4/sports/tennis_atp/odds/?apiKey=${apiKey}&regions=eu,uk&markets=h2h`,
       `https://api.the-odds-api.com/v4/sports/tennis_wta/odds/?apiKey=${apiKey}&regions=eu,uk&markets=h2h`,
       `https://api.the-odds-api.com/v4/sports/soccer_uefa_champs_league/odds/?apiKey=${apiKey}&regions=eu,uk&markets=h2h`,
       `https://api.the-odds-api.com/v4/sports/basketball_ncaab/odds/?apiKey=${apiKey}&regions=us,uk&markets=h2h`, // US College Bball (Extreme skill mismatches)
       `https://api.the-odds-api.com/v4/sports/basketball_euroleague/odds/?apiKey=${apiKey}&regions=eu,uk&markets=h2h`, // Predictable Heavy Favorites
       `https://api.the-odds-api.com/v4/sports/mma_mixed_martial_arts/odds/?apiKey=${apiKey}&regions=us,uk&markets=h2h`, // MMA/UFC (Frequent heavy locks)
       `https://api.the-odds-api.com/v4/sports/cricket_ipl/odds/?apiKey=${apiKey}&regions=uk,au&markets=h2h`, // Indian Premier League
       `https://api.the-odds-api.com/v4/sports/icehockey_nhl/odds/?apiKey=${apiKey}&regions=us,uk&markets=h2h` // Global Hockey
    ];

    const responses = await Promise.all(endpoints.map(ep => fetch(ep, { next: { revalidate: 60 } })));
    const dataArrays = await Promise.all(responses.map(res => res.ok ? res.json() : []));
    
    // Flatten arrays and Deduplicate any overlapping games natively by ID
    const rawGames = dataArrays.flat();
    const games = Array.from(new Map(rawGames.map(g => [g.id, g])).values());

    // Bankroll Fractional Split Logic:
    // Because matches happen sequentially rather than at exactly the same time,
    // we scale the percentages heavily to effectively reuse the bankroll across safe events throughout the day/week.
    const calcSuggestedStake = (odds: number) => {
      if (bankroll <= 0) return 0;
      if (odds < 1.3) return bankroll * 0.15 // 15% dedicated to Extremely Safe locks
      if (odds < 1.5) return bankroll * 0.10 // 10% dedicated for Very Safe
      if (odds < 1.7) return bankroll * 0.05 // 5% for safe
      if (odds < 2.0) return bankroll * 0.03 // 3% for moderate risk
      return bankroll * 0.01 // 1% for wildcard risky plays
    }

    const suggestions = []
    
    // Evaluate upcoming matches across globally scanned bookmakers
    for (const game of games) {
      if (!game.bookmakers || game.bookmakers.length === 0) continue;

      const commenceDate = new Date(game.commence_time);
      const now = new Date();
      const timeDiffHours = (commenceDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (timeDiffHours < 0 || timeDiffHours > 48) continue;
      
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
      let bestHome = 0;
      let bestAway = 0;
      let bestDraw = 0;
      let hasDraw = false;

      for (const bookie of game.bookmakers) {
        const h2h = bookie.markets.find((m: {key: string; outcomes: {name: string, price: number}[]}) => m.key === 'h2h');
        if (!h2h) continue;
        
        // Track the specific highest odds for the favored team natively
        const out = h2h.outcomes.find((o: {name: string, price: number}) => o.name === favoredTeam);
        if (out && out.price > bestPriceForFavored) {
           bestPriceForFavored = out.price;
           bestBookieTitle = bookie.title;
        }

        // Track aggregate odds precisely for margin calculation
        for (const outcome of h2h.outcomes) {
          if (outcome.name === game.home_team) bestHome = Math.max(bestHome, outcome.price)
          else if (outcome.name === game.away_team) bestAway = Math.max(bestAway, outcome.price)
          else if (outcome.name === 'Draw') {
            bestDraw = Math.max(bestDraw, outcome.price)
            hasDraw = true
          }
        }
      }

      // ONLY suggest safe bets where the absolute best odds are solidly probable (e.g., less than 2.00)
      if (bestPriceForFavored === 0 || bestPriceForFavored >= 2.0) continue; 
      if (bestHome === 0 || bestAway === 0) continue;

      // Calculate exact risk % profile based on Implied probability
      const impliedProb = 1 / bestPriceForFavored;
      const riskPercent = (1 - impliedProb) * 100;
      
      let riskLabel = 'Low Risk';
      if (bestPriceForFavored < 1.3) riskLabel = 'Extremely Safe';
      else if (bestPriceForFavored < 1.5) riskLabel = 'Very Safe';
      else if (bestPriceForFavored < 1.7) riskLabel = 'Safe';
      else if (bestPriceForFavored < 2.0) riskLabel = 'Moderate Risk';

      // Calculate Exact Bookmaker Margin (Sum of highest probabilities globally - 1)
      let impliedProbSum = (1 / bestHome) + (1 / bestAway)
      if (hasDraw && bestDraw > 0) impliedProbSum += (1 / bestDraw)
      
      const bookmakerMargin = (impliedProbSum - 1) * 100;

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
        margin: bookmakerMargin > 0 ? bookmakerMargin : 0 // Fallback clamp
      })
    }

    // Take top 5 for deep statistical analysis (limited by API-Sports daily 100 request cap)
    const analyzedMatches = await Promise.all(suggestions.slice(0, 5).map(async (m) => {
      // Extract team names from "Home vs Away" string
      const [home, away] = m.match.split(' vs ');
      const historicalWinProb = await calculateSafeScore(m.sport, home, away);
      
      return {
        ...m,
        historicalEdge: historicalWinProb > (1 / m.odds) ? 'HIGH' : 'LOW',
        realWinProb: (historicalWinProb * 100).toFixed(1) + '%'
      };
    }));

    // Re-combine and return the top 50 absolute safe matches scaled cleanly!
    const finalResult = [...analyzedMatches, ...suggestions.slice(5)].sort((a, b) => a.riskPercent - b.riskPercent);

    return NextResponse.json(finalResult.slice(0, 50));
  } catch (error) {
    console.error(error)
    return NextResponse.json([])
  }
}
