import { NextResponse } from 'next/server';
import { calculateArbitrage, Outcome, ArbitrageOp } from '@/lib/arbitrage-utils';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const totalInvestment = Number(searchParams.get('investment') || 10000);

  try {
    // 1. Fetch normalized odds
    const fetchResponse = await fetch(`${new URL(request.url).origin}/api/odds/fetch`, { next: { revalidate: 300 } });
    if (!fetchResponse.ok) throw new Error('Fetch odds failed');
    const games = await fetchResponse.json();

    const opportunities: ArbitrageOp[] = [];

    // 2. Identify Arbitrage Opportunities
    for (const game of games) {
      if (!game.bookmakers || game.bookmakers.length === 0) continue;

      // Group outcomes from all bookmakers by name (Team A, Team B, Draw)
      const outcomesByName: { [name: string]: Outcome[] } = {};

      interface OddsAPIBookmaker {
        title: string;
        markets: {
          key: string;
          outcomes: Outcome[];
        }[];
      }

      game.bookmakers.forEach((bookie: OddsAPIBookmaker) => {
        bookie.markets.forEach((market) => {
          if (market.key === 'h2h') {
            market.outcomes.forEach((outcome: Outcome) => {
              if (!outcomesByName[outcome.name]) outcomesByName[outcome.name] = [];
              outcomesByName[outcome.name].push(outcome);
            });
          }
        });
      });

      // 3. For each match, we need the BEST odds for each unique outcome.
      const bestOutcomes: Outcome[] = Object.keys(outcomesByName).map((name) => {
        return outcomesByName[name].reduce((prev, curr) => (curr.odds > prev.odds ? curr : prev));
      });

      // If we have at least 2 outcomes, check for arbitrage
      if (bestOutcomes.length >= 2) {
        const op = calculateArbitrage(game.match, game.sport, 'h2h', bestOutcomes, totalInvestment);
        if (op && op.arbitragePercentage > 0) {
          opportunities.push(op);
        }
      }
    }

    // 4. Return top opportunities sorted by percentage
    opportunities.sort((a, b) => b.arbitragePercentage - a.arbitragePercentage);

    return NextResponse.json(opportunities);
  } catch (error) {
    console.error('Arbitrage calculation failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
