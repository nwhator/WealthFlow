import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

type Outcome = {
  name: string
  odds: number
  bookmaker: string
  stake: number
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

const formatDate = (dateStr: string) => {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleString('en-GB', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' })
    .format(amount).replace('NGN', '₦')

const profitTier = (pct: number) => {
  if (pct >= 3) return { ring: 'ring-emerald-500/30', glow: 'shadow-emerald-500/20', badge: 'bg-emerald-500 text-white', label: 'Elite', hover: 'hover:shadow-emerald-500/30' }
  if (pct >= 1.5) return { ring: 'ring-primary/40', glow: 'shadow-primary/20', badge: 'bg-primary text-on-primary', label: 'Strong', hover: 'hover:shadow-primary/30' }
  return { ring: 'ring-outline-variant/20', glow: 'shadow-transparent', badge: 'bg-surface-container-highest text-on-surface-variant', label: 'Marginal', hover: 'hover:shadow-black/10' }
}

export default async function ArbitrageDetailPage({
  params
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // We could be viewing a Live item (from arbitrage_cache) or a Saved item (from arbitrage_opportunities)
  let opData = null
  let isSaved = false

  // Check cache first
  const { data: cached } = await supabase
    .from('arbitrage_cache')
    .select('*')
    .eq('id', params.id)
    .single()

  if (cached) {
    opData = {
      match: cached.match,
      sport: cached.sport,
      market: cached.market,
      commence_time: cached.commence_time,
      arbitragePercentage: Number(cached.arbitrage_percentage),
      guaranteedProfit: Number(cached.guaranteed_profit),
      impliedProb: Number(cached.implied_prob),
      stakeDistribution: Array.isArray(cached.stake_distribution) 
        ? cached.stake_distribution 
        // fallback in case of malformed data
        : []
    }
  } else {
    // Check saved opportunities
    const { data: saved } = await supabase
      .from('arbitrage_opportunities')
      .select('*')
      .eq('id', params.id)
      .single()

    if (saved) {
      isSaved = true
      opData = {
        match: saved.match,
        sport: saved.sport,
        market: saved.market,
        commence_time: saved.commence_time,
        arbitragePercentage: Number(saved.arbitrage_percentage),
        guaranteedProfit: Number(saved.profit_estimate),
        impliedProb: 0, // not historically stored
        stakeDistribution: saved.details?.stakeDistribution || []
      }
    }
  }

  if (!opData) notFound()

  const tier = profitTier(opData.arbitragePercentage)

  return (
    <main className="pt-24 pb-32 px-4 sm:px-6 max-w-screen-lg mx-auto min-h-screen">
      
      {/* ── Back nav ──────────────────────────────────── */}
      <div className="pt-8 mb-8">
        <Link href="/arbitrage" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Arbitrage Desk
        </Link>
      </div>

      {/* ── Hero ──────────────────────────────────────── */}
      <section className={`relative bg-surface-container-low rounded-[2rem] border border-outline-variant/10 ring-1 ${tier.ring} p-8 mb-8 overflow-hidden shadow-xl ${tier.glow}`}>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 mb-6">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-lg ${tier.badge}`}>
                {tier.label} Opp
              </span>
              <span className="text-[9px] px-3 py-1 rounded-full bg-surface-container-highest border border-outline-variant/10 text-on-surface-variant font-black uppercase tracking-widest">
                {opData.market === 'h2h' ? 'Match Result' : opData.market === 'totals' ? 'Over/Under' : 'Handicap'}
              </span>
              <span className="text-[9px] px-3 py-1 rounded-full bg-surface-container-highest border border-outline-variant/10 text-on-surface-variant font-black uppercase tracking-widest border-emerald-500/20 text-emerald-500 bg-emerald-500/5">
                {isSaved ? 'Bookmarked' : 'Live Engine Scanned'}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-on-surface tracking-tight leading-snug mb-2">{opData.match}</h1>
            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px]">calendar_today</span>
              {formatDate(opData.commence_time)}
            </p>
          </div>

          <div className={`shrink-0 w-24 h-24 rounded-3xl flex flex-col items-center justify-center font-black ${tier.badge} shadow-xl`}>
            <span className="text-3xl leading-none">{opData.arbitragePercentage.toFixed(1)}</span>
            <span className="text-[10px] uppercase tracking-widest">% Edge</span>
          </div>
        </div>

        {/* Profit box */}
        <div className="bg-surface-container-highest/40 rounded-2xl p-6 border border-outline-variant/5 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Secured Cash Return</span>
            </div>
            <span className="text-5xl font-black text-emerald-400 tracking-tighter">{formatCurrency(opData.guaranteedProfit)}</span>
            <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold mt-2">Based on ₦10,000 reference total stake</p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-surface-container-low px-4 py-3 rounded-xl border border-outline-variant/10 text-center">
              <span className="text-[9px] uppercase font-black text-zinc-500 tracking-widest mb-1 block">Risk Level</span>
              <span className="text-sm font-black text-emerald-500">Zero (Hedged)</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Required Bets Instruction ─────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">receipt_long</span>
            <h2 className="text-[10px] uppercase tracking-[0.2em] font-black text-on-surface-variant">Arbitrage Execution Playbook</h2>
          </div>
          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">To secure {formatCurrency(opData.guaranteedProfit)}</span>
        </div>

        <div className="bg-surface-container-low rounded-3xl border border-outline-variant/10 overflow-hidden divide-y divide-outline-variant/5">
          <div className="px-6 py-4 bg-primary/5 text-[9px] font-black uppercase tracking-widest text-primary flex justify-between">
            <span>To guarantee profit, place these exact bets simultaneously</span>
            <span>Total Stake: ₦10,000</span>
          </div>
          
          {opData.stakeDistribution.map((outcome: Outcome, i: number) => {
            const meta = getBookmakerMeta(outcome.bookmaker)
            return (
              <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-6 hover:bg-surface-container-high/30 transition-colors gap-4">
                
                {/* Bookmaker Info */}
                <div className="flex items-center gap-4 w-1/3">
                  <div className="w-12 h-12 rounded-xl bg-surface-container-high border border-outline-variant/10 flex flex-col items-center justify-center">
                    <span className="text-xl leading-none">{meta.flag}</span>
                  </div>
                  <div>
                    <span className="font-bold text-sm text-on-surface block leading-tight mb-1">{outcome.bookmaker}</span>
                    <span className={`text-[8px] font-black uppercase tracking-widest ${meta.color}`}>{meta.region}</span>
                  </div>
                </div>

                {/* Bet Target */}
                <div className="w-1/3 text-left md:text-center border-l-2 md:border-l-0 border-primary/20 pl-4 md:pl-0">
                  <span className="text-[9px] uppercase font-black text-zinc-500 tracking-widest block mb-1">Place Bet On</span>
                  <span className="text-lg font-black text-on-surface tracking-tight bg-surface-container-highest px-3 py-1 rounded inline-block">
                    {outcome.name}
                  </span>
                </div>

                {/* Specifics */}
                <div className="flex items-center justify-between gap-6 w-full md:w-1/3 bg-surface-container-high/50 p-4 rounded-xl border border-outline-variant/10">
                  <div className="text-left">
                    <span className="text-[9px] uppercase font-black text-zinc-500 tracking-widest block mb-1">Target Odds</span>
                    <span className="text-2xl font-black text-primary tracking-tighter">{outcome.odds.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase font-black text-zinc-500 tracking-widest block mb-1">Exact Stake</span>
                    <span className="text-lg font-black text-on-surface tracking-tighter">{formatCurrency(outcome.stake)}</span>
                  </div>
                </div>

              </div>
            )
          })}
        </div>
      </section>

    </main>
  )
}
