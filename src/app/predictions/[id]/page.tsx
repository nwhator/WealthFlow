import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getUserPlan } from '@/lib/subscription'

type Prediction = {
  id: string
  match: string
  sport: string
  market: string
  prediction: string
  line: number | null
  odds: number
  confidence: number
  reason: string
  edge: number
  market_average: number
  market_margin: number
  volatility: string
  liquidity: string
  unit_return: number
  commence_time: string
  bookmaker: string
}

const marketFullLabel = (market: string, line: number | null) => {
  if (market === 'totals') return `Over / Under${line !== null ? ` ${Math.abs(line)}` : ''}`
  if (market === 'spreads') return `Handicap / Spread`
  return 'Match Result (1X2)'
}

const formatDate = (iso: string) => {
  if (!iso) return 'N/A'
  return new Date(iso).toLocaleString('en-GB', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' })
    .format(amount).replace('NGN', '₦')

const confidenceTier = (c: number) => {
  if (c >= 70) return { badge: 'bg-primary text-on-primary', glow: 'shadow-primary/20', label: 'Gold Pick', ring: 'ring-primary/20', accent: 'from-primary/10' }
  if (c >= 50) return { badge: 'bg-yellow-400 text-zinc-900', glow: 'shadow-yellow-400/20', label: 'Standard', ring: 'ring-yellow-400/20', accent: 'from-yellow-400/10' }
  return { badge: 'bg-zinc-700 text-zinc-300', glow: 'shadow-none', label: 'Developing', ring: 'ring-zinc-700/20', accent: 'from-zinc-700/5' }
}

// ── Regional bookmaker definitions ─────────────────────────────────────────
const BOOKMAKER_REGIONS: Record<string, { region: string; flag: string; color: string }> = {
  // 🌍 Africa
  '1xBet':      { region: 'Africa / Global', flag: '🌍', color: 'text-emerald-400' },
  'SportyBet':  { region: 'Africa',          flag: '🌍', color: 'text-emerald-400' },
  'BetKing':    { region: 'Africa',          flag: '🌍', color: 'text-emerald-400' },
  'Melbet':     { region: 'Africa / Global', flag: '🌍', color: 'text-emerald-400' },
  'NairaBet':   { region: 'Africa',          flag: '🌍', color: 'text-emerald-400' },
  'BetWay':     { region: 'Africa / UK',     flag: '🌍', color: 'text-emerald-400' },
  'BangBet':    { region: 'Africa',          flag: '🌍', color: 'text-emerald-400' },
  // 🇪🇺 Europe
  'Bet365':     { region: 'Europe / Global', flag: '🇪🇺', color: 'text-blue-400' },
  'Unibet':     { region: 'Europe',          flag: '🇪🇺', color: 'text-blue-400' },
  'Bwin':       { region: 'Europe',          flag: '🇪🇺', color: 'text-blue-400' },
  'William Hill': { region: 'Europe',        flag: '🇪🇺', color: 'text-blue-400' },
  'Pinnacle':   { region: 'Europe / Global', flag: '🇪🇺', color: 'text-blue-400' },
  'Betfair':    { region: 'Europe',          flag: '🇪🇺', color: 'text-blue-400' },
  'Ladbrokes':  { region: 'Europe',          flag: '🇪🇺', color: 'text-blue-400' },
  // 🇺🇸 Americas
  'DraftKings': { region: 'USA',             flag: '🇺🇸', color: 'text-red-400' },
  'FanDuel':    { region: 'USA',             flag: '🇺🇸', color: 'text-red-400' },
  'BetMGM':     { region: 'USA',             flag: '🇺🇸', color: 'text-red-400' },
  'PointsBet':  { region: 'USA / AU',        flag: '🇺🇸', color: 'text-red-400' },
  // 🇦🇺 Australia
  'Sportsbet':  { region: 'Australia',       flag: '🇦🇺', color: 'text-orange-400' },
  'TAB':        { region: 'Australia',       flag: '🇦🇺', color: 'text-orange-400' },
}

function getBookmakerMeta(name: string) {
  return BOOKMAKER_REGIONS[name] || { region: 'Global', flag: '🌐', color: 'text-zinc-400' }
}

export default async function PredictionDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const plan = await getUserPlan(user.id)
  const isPremium = plan === 'premium'

  const { data: pred } = await supabase
    .from('predictions_cache')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!pred) notFound()
  const p = pred as Prediction

  // Fetch all OTHER predictions for the same match & market to show bookmaker breakdown
  const { data: siblings } = await supabase
    .from('predictions_cache')
    .select('prediction, odds, bookmaker, confidence, line')
    .eq('match', p.match)
    .eq('market', p.market)
    .neq('id', p.id)
    .order('odds', { ascending: false })

  // Combine this pick + siblings for complete bookmaker table
  const allBookmakers = [
    { prediction: p.prediction, odds: p.odds, bookmaker: p.bookmaker, confidence: p.confidence, isBest: true },
    ...((siblings || []).map(s => ({ prediction: s.prediction, odds: Number(s.odds), bookmaker: s.bookmaker, confidence: s.confidence, isBest: false }))),
  ].sort((a, b) => b.odds - a.odds)

  const tier = confidenceTier(p.confidence)

  // Group by outcome label for easy "best pick" highlighting
  const outcomeGroups: Record<string, typeof allBookmakers> = {}
  for (const bk of allBookmakers) {
    if (!outcomeGroups[bk.prediction]) outcomeGroups[bk.prediction] = []
    outcomeGroups[bk.prediction].push(bk)
  }

  return (
    <main className="pt-24 pb-32 px-4 sm:px-6 max-w-screen-lg mx-auto min-h-screen">

      {/* ── Back nav ──────────────────────────────────── */}
      <div className="pt-8 mb-8">
        <Link href="/predictions" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          All Picks
        </Link>
      </div>

      {/* ── Hero ──────────────────────────────────────── */}
      <section className={`relative bg-gradient-to-br ${tier.accent} via-surface-container-low to-surface-container-low rounded-[2rem] border border-outline-variant/10 ring-1 ${tier.ring} p-8 mb-8 overflow-hidden`}>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 mb-6">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-lg ${tier.badge} ${tier.glow}`}>
                {tier.label}
              </span>
              <span className="text-[9px] px-3 py-1 rounded-full bg-surface-container-highest border border-outline-variant/10 text-on-surface-variant font-black uppercase tracking-widest">
                {marketFullLabel(p.market, p.line)}
              </span>
              <span className="text-[9px] px-3 py-1 rounded-full bg-surface-container-highest border border-outline-variant/10 text-on-surface-variant font-black uppercase tracking-widest">
                {p.sport}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-on-surface tracking-tight leading-snug mb-2">{p.match}</h1>
            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">{formatDate(p.commence_time)}</p>
          </div>

          {/* Confidence dial */}
          <div className={`shrink-0 w-24 h-24 rounded-3xl flex flex-col items-center justify-center font-black ${tier.badge} shadow-xl ${tier.glow}`}>
            <span className="text-3xl leading-none">{p.confidence}</span>
            <span className="text-[10px] uppercase tracking-widest">%</span>
          </div>
        </div>

        {/* Engine Verdict */}
        <div className="bg-surface-container-highest/40 rounded-2xl p-5 border border-outline-variant/5 mb-5">
          <p className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold mb-2">Engine Verdict</p>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-3xl font-black text-on-surface tracking-tight">{p.prediction}</p>
              {p.line !== null && p.market !== 'h2h' && (
                <p className="text-[11px] text-zinc-500 font-bold mt-1 uppercase tracking-widest">
                  Line: <span className="text-primary font-black">{p.market === 'totals' ? `${Math.abs(p.line)} Goals / Points` : `${p.line > 0 ? '+' : ''}${p.line} spread`}</span>
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Best Available Odds</p>
              <p className="text-4xl font-black text-primary tracking-tighter">{p.odds.toFixed(2)}</p>
              <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold mt-1">via {p.bookmaker}</p>
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Value Edge', value: `+${(p.edge || 0).toFixed(1)}%`, highlight: true },
            { label: 'Market Average', value: (p.market_average || 0).toFixed(2), highlight: false },
            { label: 'Win Target', value: formatCurrency(p.unit_return || 0), highlight: true },
            { label: 'House Margin', value: `${(p.market_margin || 0).toFixed(1)}%`, highlight: false },
          ].map(({ label, value, highlight }) => (
            <div key={label} className="bg-surface-container-highest/40 rounded-xl p-3 border border-outline-variant/5 text-center">
              <p className="text-[8px] uppercase tracking-widest text-zinc-500 font-black mb-1">{label}</p>
              <p className={`text-sm font-black ${highlight ? 'text-primary' : 'text-on-surface'}`}>{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Analysis Reason ───────────────────────────── */}
      <section className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-primary text-[20px]">psychology</span>
          <h2 className="text-[10px] uppercase tracking-[0.2em] font-black text-on-surface-variant">Engine Analysis</h2>
        </div>
        <p className="text-sm text-on-surface-variant leading-relaxed">{p.reason}</p>
        <div className="mt-4 flex gap-2 flex-wrap">
          <span className={`text-[9px] px-2 py-1 rounded-md font-bold border ${p.volatility === 'Active' ? 'text-red-400 border-red-400/20 bg-red-400/5' : p.volatility === 'Normal' ? 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5' : 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5'}`}>
            ⚡ Volatility: {p.volatility || 'Stable'}
          </span>
          <span className="text-[9px] px-2 py-1 rounded-md font-bold border border-outline-variant/10 text-on-surface-variant">
            Volume: {p.liquidity}
          </span>
        </div>
      </section>

      {/* ── Full Bookmaker Breakdown ───────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">storefront</span>
            <h2 className="text-[10px] uppercase tracking-[0.2em] font-black text-on-surface-variant">Bookmaker Odds Breakdown</h2>
          </div>
          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">{allBookmakers.length} sources</span>
        </div>

        {!isPremium && (
          <div className="mb-6 p-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-between gap-4">
            <p className="text-xs font-bold text-on-surface-variant">
              <span className="text-primary font-black">Pro</span> — see odds from every regional bookmaker plus African & European platforms.
            </p>
            <Link href="/pricing" className="shrink-0 px-5 py-2 bg-primary text-on-primary rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
              Upgrade →
            </Link>
          </div>
        )}

        {/* Outcome groups */}
        <div className="space-y-6">
          {Object.entries(outcomeGroups).map(([outcome, bookmakers]) => {
            const bestOdds = Math.max(...bookmakers.map(b => b.odds))
            return (
              <div key={outcome} className="bg-surface-container-low rounded-2xl border border-outline-variant/10 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant/10 bg-surface-container-high/40">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <span className="font-black text-on-surface text-sm">{outcome}</span>
                    {p.line !== null && p.market !== 'h2h' && (
                      <span className="text-[9px] px-2 py-0.5 rounded bg-surface-container-highest border border-outline-variant/10 text-zinc-400 font-bold uppercase">
                        Line {p.market === 'totals' ? Math.abs(p.line) : (p.line > 0 ? '+' : '') + p.line}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Best: <span className="text-primary">{bestOdds.toFixed(2)}</span></span>
                </div>

                <div className="divide-y divide-outline-variant/5">
                  {bookmakers.map((bk, i) => {
                    const meta = getBookmakerMeta(bk.bookmaker)
                    const isBest = bk.odds === bestOdds
                    return (
                      <div key={i} className={`flex items-center justify-between px-5 py-3.5 transition-colors ${isBest ? 'bg-primary/5' : 'hover:bg-surface-container-high/30'}`}>
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{meta.flag}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-on-surface">{bk.bookmaker}</span>
                              {isBest && (
                                <span className="text-[8px] px-1.5 py-0.5 rounded bg-primary text-on-primary font-black uppercase tracking-widest">Best</span>
                              )}
                            </div>
                            <span className={`text-[9px] font-bold uppercase tracking-widest ${meta.color}`}>{meta.region}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-xl font-black tracking-tight ${isBest ? 'text-primary' : 'text-on-surface'}`}>
                            {bk.odds.toFixed(2)}
                          </span>
                          <p className="text-[9px] text-zinc-500 font-bold">
                            Return: {formatCurrency((bk.odds - 1) * 1000)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Region legend */}
        <div className="mt-6 flex flex-wrap gap-4 px-2">
          {[
            { flag: '🌍', region: 'Africa', color: 'text-emerald-400' },
            { flag: '🇪🇺', region: 'Europe', color: 'text-blue-400' },
            { flag: '🇺🇸', region: 'Americas', color: 'text-red-400' },
            { flag: '🇦🇺', region: 'Australia', color: 'text-orange-400' },
            { flag: '🌐', region: 'Global', color: 'text-zinc-400' },
          ].map(({ flag, region, color }) => (
            <span key={region} className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest ${color}`}>
              {flag} {region}
            </span>
          ))}
        </div>
      </section>

      {/* ── Footer CTA ────────────────────────────────── */}
      <div className="mt-12 pt-8 border-t border-outline-variant/10 flex flex-col sm:flex-row items-center justify-between gap-5">
        <Link href="/predictions" className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Back to All Picks
        </Link>
        {!isPremium && (
          <Link href="/pricing" className="px-8 py-3.5 bg-primary text-on-primary rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 hover:scale-105 active:scale-95">
            Unlock Pro — Full Bookmaker Access →
          </Link>
        )}
      </div>
    </main>
  )
}
