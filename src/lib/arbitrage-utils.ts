export type Outcome = {
  name: string;
  odds: number;
  bookmaker: string;
};

export type ArbitrageOp = {
  match: string;
  sport: string;
  market: string;
  outcomes: Outcome[];
  impliedProb: number;
  arbitragePercentage: number;
  guaranteedProfit: number;
  stakeDistribution: {
    name: string;
    odds: number;
    bookmaker: string;
    stake: number;
  }[];
};

export function calculateArbitrage(
  match: string,
  sport: string,
  market: string,
  outcomes: Outcome[],
  totalInvestment: number = 10000 // Default reference
): ArbitrageOp | null {
  if (outcomes.length < 2) return null;

  // For arbitrage, we assume we take the BEST odds for each outcome from the set of available bookies
  // We'll calculate the implied probability: sum(1/best_odds_i)
  let impliedProb = 0;
  for (const o of outcomes) {
    impliedProb += 1 / o.odds;
  }

  // An arbitrage exists if impliedProb < 1
  if (impliedProb >= 1) return null;

  const arbitragePercentage = (1 - impliedProb) * 100;
  
  // stake1 = total_investment / odds1 / implied_probability
  const stakeDistribution = outcomes.map((o) => ({
    ...o,
    stake: (totalInvestment / o.odds) / impliedProb,
  }));

  // profit = stake * odds - investment
  const firstStake = stakeDistribution[0];
  const guaranteedProfit = (firstStake.stake * firstStake.odds) - totalInvestment;

  return {
    match,
    sport,
    market,
    outcomes,
    impliedProb,
    arbitragePercentage,
    guaranteedProfit,
    stakeDistribution,
  };
}
