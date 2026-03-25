const sportToDomain: Record<string, string> = {
  'football': 'v3.football',
  'soccer': 'v3.football',
  'basketball': 'v1.basketball',
  'nba': 'v2.nba',
  'nfl': 'v1.american-football',
  'baseball': 'v1.baseball',
  'hockey': 'v1.hockey',
  'mma': 'v1.mma',
  'volleyball': 'v1.volleyball'
};

async function fetchStats(sport: string, endpoint: string, params: Record<string, string>) {
  const apiKey = process.env.SPORTS_API_KEY;
  const baseDomain = process.env.SPORTS_API_BASE_URL; // api-sports.io
  
  if (!apiKey || !baseDomain) return null;

  const prefix = sportToDomain[sport.toLowerCase()] || 'v3.football';
  const url = new URL(`https://${prefix}.${baseDomain}/${endpoint}`);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'x-apisports-key': apiKey
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    return res.json();
  } catch (error) {
    console.error(`Fetch stats failed for ${sport}:`, error);
    return null;
  }
}

/**
 * Calculates a win probability based on real historical data from API-Sports
 */
export async function calculateSafeScore(sport: string, homeTeam: string, awayTeam: string) {
  // 1. Fetch H2H stats
  const h2h = await fetchStats(sport, 'fixtures/headtohead', { h2h: `${homeTeam}-${awayTeam}` });
  
  // 2. Fallback to basic if no H2H (often happens)
  if (!h2h || !h2h.response || h2h.response.length === 0) {
    return 0.5; // neutral 50%
  }

  // 3. Simple historical win ratio
  const homeWins = h2h.response.filter((r: { teams: { home: { name: string; winner: boolean } } }) => r.teams.home.name === homeTeam && r.teams.home.winner).length;
  const total = h2h.response.length;

  return (homeWins / total) || 0.5;
}
