import { NextResponse } from 'next/server';
import { calculateArbitrage, Outcome, ArbitrageOp } from '@/lib/arbitrage-utils';
import { getNormalizedOdds } from '@/lib/odds-service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const totalInvestment = Number(searchParams.get('investment') || 10000);

  try {
    const games = await getNormalizedOdds();
    const opportunities: ArbitrageOp[] = [];

    for (const game of games) {
      if (!game.bookmakers || game.bookmakers.length === 0) continue;
      const outcomesByName: { [name: string]: Outcome[] } = {};

      game.bookmakers.forEach((bookie) => {
        bookie.markets.forEach((market) => {
          if (market.key === 'h2h') {
            market.outcomes.forEach((outcome) => {
              if (!outcomesByName[outcome.name]) outcomesByName[outcome.name] = [];
              outcomesByName[outcome.name].push(outcome);
            });
          }
        });
      });

      const bestOutcomes: Outcome[] = Object.keys(outcomesByName).map((name) => {
        return outcomesByName[name].reduce((prev, curr) => (curr.odds > prev.odds ? curr : prev));
      });

      if (bestOutcomes.length >= 2) {
        const op = calculateArbitrage(game.match, game.sport, 'h2h', bestOutcomes, totalInvestment);
        if (op && op.arbitragePercentage > 0) {
          opportunities.push(op);
        }
      }
    }

    opportunities.sort((a, b) => b.arbitragePercentage - a.arbitragePercentage);
    return NextResponse.json(opportunities);
  } catch (error) {
    console.error('Arbitrage calculation failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
