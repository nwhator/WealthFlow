import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.ODDS_API_KEY;
  const baseUrl = process.env.ODDS_API_BASE_URL;

  if (!apiKey || !baseUrl) {
    return NextResponse.json({ error: 'Missing API configuration' }, { status: 500 });
  }

  try {
    const endpoints = [
      `${baseUrl}/sports/upcoming/odds/?apiKey=${apiKey}&regions=eu,uk,us,au&markets=h2h`,
      `${baseUrl}/sports/basketball_nba/odds/?apiKey=${apiKey}&regions=us,uk&markets=h2h`,
    ];

    const responses = await Promise.all(endpoints.map(ep => fetch(ep, { next: { revalidate: 300 } })));
    const allData = await Promise.all(responses.map(res => res.ok ? res.json() : []));
    
    // Normalize response for the arbitrage engine
    const rawGames = allData.flat();
    const normalizedData = rawGames.map((game: any) => ({
      id: game.id,
      match: `${game.home_team} vs ${game.away_team}`,
      sport: game.sport_title,
      commence_time: game.commence_time,
      bookmakers: game.bookmakers.map((b: any) => ({
        name: b.title,
        markets: b.markets.map((m: any) => ({
          key: m.key,
          outcomes: m.outcomes.map((o: any) => ({
            name: o.name,
            odds: o.price,
            bookmaker: b.title
          }))
        }))
      }))
    }));

    return NextResponse.json(normalizedData);
  } catch (error) {
    console.error('Odds fetch failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
