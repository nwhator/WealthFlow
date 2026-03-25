export interface OddsAPIOutcome {
  name: string;
  price: number;
}
export interface OddsAPIMarket {
  key: string;
  outcomes: OddsAPIOutcome[];
}
export interface OddsAPIBookmaker {
  title: string;
  markets: OddsAPIMarket[];
}
export interface OddsAPIGame {
  id: string;
  home_team: string;
  away_team: string;
  sport_title: string;
  commence_time: string;
  bookmakers: OddsAPIBookmaker[];
}

export interface NormalizedGame {
  id: string;
  match: string;
  sport: string;
  commence_time: string;
  bookmakers: {
    name: string;
    markets: {
      key: string;
      outcomes: {
        name: string;
        odds: number;
        bookmaker: string;
      }[];
    }[];
  }[];
}

export async function getNormalizedOdds(): Promise<NormalizedGame[]> {
  const apiKey = process.env.ODDS_API_KEY;
  const baseUrl = process.env.ODDS_API_BASE_URL;

  if (!apiKey || !baseUrl) {
    throw new Error('Missing API configuration');
  }

  const endpoints = [
    `${baseUrl}/sports/upcoming/odds/?apiKey=${apiKey}&regions=eu,uk,us,au&markets=h2h`,
    `${baseUrl}/sports/basketball_nba/odds/?apiKey=${apiKey}&regions=us,uk&markets=h2h`,
  ];

  try {
    const responses = await Promise.all(endpoints.map(ep => fetch(ep, { next: { revalidate: 300 } })));
    const allData = await Promise.all(responses.map(res => res.ok ? res.json() : []));
    
    const rawGames = allData.flat();
    const normalizedData: NormalizedGame[] = (rawGames as OddsAPIGame[])
      .filter(g => g && g.id && Array.isArray(g.bookmakers))
      .map((game: OddsAPIGame) => ({
        id: game.id,
        match: `${game.home_team} vs ${game.away_team}`,
        sport: game.sport_title,
        commence_time: game.commence_time,
        bookmakers: game.bookmakers.map((b: OddsAPIBookmaker) => ({
          name: b.title,
          markets: (b.markets || []).map((m: OddsAPIMarket) => ({
            key: m.key,
            outcomes: (m.outcomes || []).map((o: OddsAPIOutcome) => ({
              name: o.name,
              odds: o.price,
              bookmaker: b.title
            }))
          }))
        }))
      }));

    return normalizedData;
  } catch (error) {
    console.error('Odds fetch service failed:', error);
    throw error;
  }
}
