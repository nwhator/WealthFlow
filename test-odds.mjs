const key = 'fa155a17f95bc3c2daaeffff2bf3ccf4';
const baseUrl = 'https://api.the-odds-api.com/v4';
const url = `${baseUrl}/sports/upcoming/odds/?apiKey=${key}&regions=eu,uk,us,au&markets=totals`;

fetch(url)
  .then(res => res.json())
  .then(data => {
    let totalsMarket;
    for (const game of data) {
      for (const bookie of (game.bookmakers || [])) {
        for (const market of (bookie.markets || [])) {
          if (market.key === 'totals') {
            totalsMarket = market;
            break;
          }
        }
        if (totalsMarket) break;
      }
      if (totalsMarket) break;
    }
    console.log(JSON.stringify(totalsMarket, null, 2));
  })
  .catch(console.error);
