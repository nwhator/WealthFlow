'use client'

import { useState, useEffect, useCallback } from 'react'
import { bookmarkOpportunity, getSavedOpportunities } from './actions'
import PremiumPaywall from '@/components/PremiumPaywall'
import Link from 'next/link'
import DataFreshnessIndicator from '@/components/DataFreshnessIndicator'
import ScanButton from '@/components/ScanButton'

type Outcome = {
  name: string
  odds: number
  bookmaker: string
  stake: number
}

type ArbitrageOp = {
  id: string
  sport: string
  match: string
  market: string
  commence_time: string
  arbitragePercentage: number
  guaranteedProfit: number
  impliedProb: number
  stakeDistribution: Outcome[]
}

type SavedOp = {
  id: string
  match: string
  sport: string
  market: string
  commence_time: string
  arbitrage_percentage: number
  profit_estimate: number
  details: { stakeDistribution: Outcome[] }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' })
    .format(amount).replace('NGN', '₦')

const profitTier = (pct: number) => {
  if (pct >= 3) return { ring: 'ring-emerald-500/30', glow: 'shadow-emerald-500/10', badge: 'bg-emerald-500 text-white', label: 'Elite', dot: 'bg-emerald-400' }
  if (pct >= 1.5) return { ring: 'ring-primary/30', glow: 'shadow-primary/10', badge: 'bg-primary text-on-primary', label: 'Strong', dot: 'bg-primary' }
  return { ring: 'ring-outline-variant/20', glow: 'shadow-transparent', badge: 'bg-surface-container-highest text-on-surface-variant', label: 'Marginal', dot: 'bg-zinc-500' }
}

const extractLine = (name: string, market: string) => {
  if (market === 'h2h' || !name) return ''
  const match = name.match(/([+-]?\d+\.?\d*)$/)
  return match ? match[1] : ''
}

const SPORTS = ['All', 'Football', 'Basketball', 'Tennis', 'MMA', 'Hockey']

export default function ArbitrageDashboard() {
  const [activeTab, setActiveTab] = useState<'Live' | 'Saved'>('Live')
  const [opportunities, setOpportunities] = useState<ArbitrageOp[]>([])
  const [savedOpportunities, setSavedOpportunities] = useState<SavedOp[]>([])
  const [loading, setLoading] = useState(true)
  const [investment, setInvestment] = useState(10000)
  const [debouncedInvestment, setDebouncedInvestment] = useState(10000)
  const [filter, setFilter] = useState('All')
  const [savingId, setSavingId] = useState<number | null>(null)
  const [isPremium, setIsPremium] = useState<boolean | null>(null)

  useEffect(() => {
    const h = setTimeout(() => setDebouncedInvestment(investment), 500)
    return () => clearTimeout(h)
  }, [investment])

  const handleBookmark = async (op: ArbitrageOp, idx: number) => {
    setSavingId(idx)
    const res = await bookmarkOpportunity({
      match: op.match, sport: op.sport, market: op.market,
      commence_time: op.commence_time,
      arbitrage_percentage: op.arbitragePercentage,
      profit_estimate: op.guaranteedProfit,
      details: { stakeDistribution: op.stakeDistribution },
    })
    setSavingId(null)
    if (res.error) alert(res.error)
    else { alert('Opportunity bookmarked!'); fetchSaved() }
  }

  const fetchData = useCallback(async () => {
    if (activeTab === 'Saved') return
    setLoading(true)
    try {
      const res = await fetch(`/api/arbitrage/calculate?investment=${debouncedInvestment}`)
      if (!res.ok) throw new Error('API failed')
      const data = await res.json()
      if (data.isPremiumRequired) { setIsPremium(false); setOpportunities([]); return }
      setIsPremium(true)
      setOpportunities(Array.isArray(data) ? data : [])
    } catch {
      setOpportunities([])
    } finally {
      setLoading(false)
    }
  }, [debouncedInvestment, activeTab])

  const fetchSaved = useCallback(async () => {
    if (activeTab === 'Live') return
    setLoading(true)
    try {
      const res = await getSavedOpportunities()
      if (res.data) setSavedOpportunities(res.data)
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    if (activeTab === 'Live') fetchData()
    else fetchSaved()
  }, [fetchData, fetchSaved, activeTab])

  const filtered = (activeTab === 'Live' ? opportunities : savedOpportunities)
    .filter(op => filter === 'All' || op.sport.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => {
      const dateA = new Date(a.commence_time).getTime()
      const dateB = new Date(b.commence_time).getTime()
      if (dateA !== dateB) return dateA - dateB
      return (b.arbitragePercentage || 0) - (a.arbitragePercentage || 0)
    })

  const totalProfit = (filtered as ArbitrageOp[]).reduce((s, op) => s + (op.guaranteedProfit || 0), 0)

  return (
    <div className="min-h-screen bg-surface-dim pb-32">
      <main className="pt-24 px-4 sm:px-6 max-w-screen-2xl mx-auto">

        {/* ── Hero ──────────────────────────────────────────── */}
        <section className="mb-10 pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-end gap-8">
            <div className="max-w-2xl">
              {/* Tabs */}
              <div className="flex bg-surface-container-high rounded-full p-1.5 w-fit mb-5">
                {(['Live', 'Saved'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${activeTab === tab ? 'bg-primary text-on-primary shadow-lg' : 'text-on-surface-variant hover:bg-surface-container-highest'}`}
                  >
                    {tab === 'Live' ? 'Live Market' : 'Saved Ops'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  Live Market Intelligence
                </span>
              </div>
              <h1 className="text-5xl sm:text-6xl font-black text-on-surface tracking-tight leading-[1.05] mb-3">
                Arbitrage<br />
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Desk</span>
              </h1>
              <p className="text-on-surface-variant text-base max-w-lg leading-relaxed mb-4">
                {activeTab === 'Live'
                  ? 'Identify guaranteed-profit discrepancies across global sportsbooks. Data refreshes every 24h.'
                  : 'Review your previously identified arbitrage opportunities.'}
              </p>
              <div className="flex gap-4 items-center">
                <Link href="/arbitrage/calculator" className="inline-flex items-center gap-2 text-primary font-black uppercase tracking-[0.1em] text-[10px] hover:underline">
                  <span className="material-symbols-outlined text-sm">calculate</span>
                  Manual Calculator
                </Link>
                {activeTab === 'Live' && <ScanButton />}
              </div>
            </div>

            {/* KPIs */}
            <div className="flex gap-4 flex-wrap shrink-0">
              <div className="bg-surface-container-low border border-outline-variant/10 px-6 py-5 rounded-2xl min-w-[160px]">
                <p className="text-[8px] uppercase tracking-widest text-zinc-500 mb-1 font-black">Investment Ref.</p>
                <div className="flex items-center gap-1">
                  <span className="text-xl text-primary font-black">₦</span>
                  <input
                    type="number"
                    value={investment}
                    onChange={e => setInvestment(Number(e.target.value))}
                    className="bg-transparent text-2xl font-black text-on-surface border-none outline-none w-28 tracking-tighter"
                  />
                </div>
              </div>
              <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 to-surface-container-low border border-primary/20 px-6 py-5 rounded-2xl min-w-[130px]">
                <div className="absolute top-0 right-0 w-12 h-12 bg-primary/5 rounded-bl-full" />
                <p className="text-[8px] uppercase tracking-widest text-primary font-black mb-1">Opportunities</p>
                <p className="text-3xl font-black text-primary">{loading ? '...' : filtered.length}</p>
              </div>
              {activeTab === 'Live' && !loading && filtered.length > 0 && (
                <div className="bg-surface-container-low border border-outline-variant/10 px-6 py-5 rounded-2xl min-w-[160px]">
                  <p className="text-[8px] uppercase tracking-widest text-zinc-500 mb-1 font-black">Total Profit Pool</p>
                  <p className="text-xl font-black text-emerald-400">{formatCurrency(totalProfit)}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Paywall for free users */}
        {!loading && isPremium === false && activeTab === 'Live' && (
          <div className="mb-8">
            <PremiumPaywall
              title="Arbitrage Desk is a Pro Feature"
              message="Upgrade to WealthFlow Pro to unlock real-time arbitrage detection across 8+ global sports markets."
            />
          </div>
        )}

        {/* Filters + freshness */}
        {isPremium !== false && (
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-2 flex-wrap">
              {SPORTS.map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${filter === f ? 'bg-primary text-on-primary shadow-md shadow-primary/20' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'}`}
                >
                  {f}
                </button>
              ))}
            </div>
            <DataFreshnessIndicator />
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-surface-container-low rounded-2xl h-72 border border-outline-variant/10" />
            ))}
          </div>
        ) : isPremium !== false && filtered.length === 0 ? (
          <div className="text-center py-24 bg-surface-container-low rounded-3xl border border-dashed border-outline-variant/20">
            <span className="material-symbols-outlined text-7xl text-on-surface-variant mb-4 opacity-30 block">search_off</span>
            <p className="text-on-surface-variant font-bold text-lg">No profitable opportunities right now.</p>
            <p className="text-on-surface-variant/60 text-sm mt-2">Data refreshes automatically every 24 hours.</p>
          </div>
        ) : isPremium !== false ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {activeTab === 'Live'
              ? (filtered as ArbitrageOp[]).map((op, idx) => (
                <ArbitrageCard key={idx} op={op} onBookmark={() => handleBookmark(op, idx)} saving={savingId === idx} />
              ))
              : (filtered as SavedOp[]).map((sop, idx) => (
                <SavedArbitrageCard key={idx} sop={sop} />
              ))
            }
          </div>
        ) : null}
      </main>
    </div>
  )
}

function ArbitrageCard({ op, onBookmark, saving }: { op: ArbitrageOp; onBookmark: () => void; saving: boolean }) {
  const tier = profitTier(op.arbitragePercentage)
  return (
    <Link href={`/arbitrage/${op.id}`} className={`block group relative bg-surface-container-low rounded-2xl ring-1 ${tier.ring} overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl ${tier.glow}`}>
      {/* Top gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-widest ${tier.badge}`}>
                {tier.label}
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded-md bg-surface-container-highest text-on-surface-variant font-black uppercase tracking-widest border border-outline-variant/10">
                {op.market === 'h2h' ? 'Match Result' : op.market === 'totals' ? `O/U ${extractLine(op.stakeDistribution[0]?.name, op.market)}` : `Spread ${extractLine(op.stakeDistribution[0]?.name, op.market)}`}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${tier.dot}`} />
              <span className="text-[9px] text-on-surface-variant font-black uppercase tracking-widest truncate">{op.sport}</span>
            </div>
            <h3 className="font-bold text-on-surface text-sm leading-snug truncate">{op.match}</h3>
            <span className="text-[9px] text-zinc-500 font-mono">{formatDate(op.commence_time)}</span>
          </div>
          <div className={`shrink-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black ${tier.badge}`}>
            <span className="text-lg leading-none">{op.arbitragePercentage.toFixed(1)}</span>
            <span className="text-[8px] leading-none">%</span>
          </div>
        </div>

        {/* Outcomes */}
        <div className="space-y-2 mb-5">
          {op.stakeDistribution.map((outcome, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-container-high border border-outline-variant/10 hover:border-primary/20 transition-colors">
              <div>
                <span className="text-xs font-bold text-on-surface block">{outcome.bookmaker}</span>
                <span className="text-[9px] text-on-surface-variant uppercase font-semibold">{outcome.name}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-mono font-bold text-primary block">{outcome.odds.toFixed(2)}</span>
                <span className="text-[9px] text-on-surface-variant">Stake: {formatCurrency(outcome.stake)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Profit + CTA */}
        <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-black">Secured Return</span>
            </div>
            <span className="text-2xl font-black text-emerald-400">{formatCurrency(op.guaranteedProfit)}</span>
          </div>
          <button
            onClick={(e) => { e.preventDefault(); onBookmark() }}
            disabled={saving}
            className="bg-primary/10 text-primary px-5 py-2 rounded-full font-black text-[10px] hover:bg-primary/20 active:scale-95 transition-all uppercase tracking-widest border border-primary/20 disabled:opacity-50 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">bookmark</span>
            {saving ? '...' : 'Track'}
          </button>
        </div>

        <div className="mt-3 pt-3 border-t border-dashed border-outline-variant/20 flex items-center justify-between">
          <span className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Risk: Zero (Secured)</span>
          <span className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Coverage: {((op.impliedProb || 0) * 100).toFixed(1)}%</span>
        </div>
      </div>
    </Link>
  )
}

function SavedArbitrageCard({ sop }: { sop: SavedOp }) {
  return (
    <Link href={`/arbitrage/${sop.id}`} className="block bg-surface-container-low rounded-2xl ring-1 ring-outline-variant/20 overflow-hidden opacity-80 hover:opacity-100 transition-all">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-500/20 to-transparent" />
      <div className="p-6">
        <div className="flex justify-between items-start mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[9px] px-2 py-0.5 rounded-md bg-surface-container-highest text-on-surface-variant font-black uppercase tracking-widest border border-outline-variant/10">
                 {sop.market === 'h2h' ? 'Match Result' : sop.market === 'totals' ? `O/U ${extractLine(sop.details.stakeDistribution[0]?.name, sop.market)}` : `Spread ${extractLine(sop.details.stakeDistribution[0]?.name, sop.market)}`}
              </span>
              <span className="text-[9px] uppercase tracking-widest text-on-surface-variant font-black">{sop.sport}</span>
            </div>
            <h3 className="font-bold text-on-surface text-sm leading-snug">{sop.match}</h3>
            <span className="text-[9px] text-zinc-500 font-mono">{formatDate(sop.commence_time)}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black bg-primary/10 text-primary border border-primary/20">
            <span className="text-base leading-none">{sop.arbitrage_percentage.toFixed(1)}</span>
            <span className="text-[8px]">%</span>
          </div>
        </div>
        <div className="space-y-2 mb-5">
          {sop.details.stakeDistribution.map((outcome, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-container-high border border-outline-variant/10">
              <div>
                <span className="text-xs font-bold text-on-surface block">{outcome.bookmaker}</span>
                <span className="text-[9px] text-on-surface-variant uppercase">{outcome.name}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-mono font-bold text-zinc-400 block">{outcome.odds.toFixed(2)}</span>
                <span className="text-[9px] text-on-surface-variant">Stake: {formatCurrency(outcome.stake)}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="pt-4 border-t border-outline-variant/10">
          <span className="text-[9px] text-on-surface-variant uppercase tracking-wider font-bold block mb-1">Historical Profit</span>
          <span className="text-2xl font-black text-primary">{formatCurrency(sop.profit_estimate)}</span>
        </div>
      </div>
    </Link>
  )
}
