'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type CalculationResult = {
  isArbitrage: boolean
  totalImpliedProb: number
  arbitragePercentage: number
  profit: number
  stakes: number[]
  payouts: number[]
}

export default function ArbitrageCalculator() {
  const [mode, setMode] = useState<'2-way' | '3-way'>('2-way')
  const [bankroll, setBankroll] = useState<number>(10000)
  const [odds, setOdds] = useState<string[]>(['2.10', '2.10'])
  const [result, setResult] = useState<CalculationResult | null>(null)

  useEffect(() => {
    calculate()
  }, [mode, bankroll, odds])

  const handleOddsChange = (idx: number, val: string) => {
    const next = [...odds]
    next[idx] = val
    setOdds(next)
  }

  const toggleMode = (newMode: '2-way' | '3-way') => {
    setMode(newMode)
    setOdds(newMode === '2-way' ? ['2.10', '2.10'] : ['3.10', '3.10', '3.10'])
  }

  const calculate = () => {
    const numericOdds = odds.map(o => parseFloat(o))
    if (numericOdds.some(o => isNaN(o) || o <= 1)) {
      setResult(null)
      return
    }

    let impliedProb = 0
    numericOdds.forEach(o => {
      impliedProb += 1 / o
    })

    const isArbitrage = impliedProb < 1
    const arbitragePercentage = (1 - impliedProb) * 100
    
    // Stakes: (Bankroll / Odds) / Total Implied Prob
    const stakes = numericOdds.map(o => (bankroll / o) / impliedProb)
    const payouts = stakes.map((s, i) => s * numericOdds[i])
    const profit = payouts[0] - bankroll

    setResult({
      isArbitrage,
      totalImpliedProb: impliedProb,
      arbitragePercentage,
      profit,
      stakes,
      payouts
    })
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(val).replace('NGN', '₦')
  }

  return (
    <main className="min-h-screen bg-surface-dim pt-32 pb-32 px-6">
      <div className="max-w-2xl mx-auto">
        <nav className="mb-10">
            <Link href="/arbitrage" className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-widest hover:underline">
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Back to Market Desk
            </Link>
        </nav>

        <header className="mb-12 space-y-4">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Calculation Tool</span>
          <h1 className="text-5xl font-black text-on-surface tracking-tighter leading-tight">Arbitrage Calculator</h1>
          <p className="text-on-surface-variant text-lg leading-relaxed">
            Verify manual opportunities or calculate exact stake distributions when odds shift.
          </p>
        </header>

        <section className="bg-surface-container-low rounded-3xl border border-outline-variant/10 p-8 shadow-xl shadow-surface-container-highest/10 space-y-10">
          {/* Mode Switcher */}
          <div className="flex bg-surface-container-high rounded-full p-1.5 w-fit mx-auto">
            <button 
              onClick={() => toggleMode('2-way')} 
              className={`px-8 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${mode === '2-way' ? 'bg-primary text-on-primary shadow-lg' : 'text-on-surface-variant hover:bg-surface-container-highest'}`}
            >
              2-Way (H2H)
            </button>
            <button 
              onClick={() => toggleMode('3-way')} 
              className={`px-8 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${mode === '3-way' ? 'bg-primary text-on-primary shadow-lg' : 'text-on-surface-variant hover:bg-surface-container-highest'}`}
            >
              3-Way (1X2)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Inputs */}
            <div className="space-y-6">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-black block mb-2">Total Bankroll (₦)</label>
                <input 
                  type="number" 
                  value={bankroll} 
                  onChange={(e) => setBankroll(Number(e.target.value))}
                  className="w-full bg-surface-container-high border border-outline-variant/10 rounded-2xl p-4 text-xl font-bold text-on-surface outline-none focus:border-primary/50 transition-all shadow-inner"
                  placeholder="10000"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-black block mb-1">Enter Odds</label>
                {odds.map((o, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-[10px] font-black text-on-surface-variant">{i + 1}</span>
                    <input 
                      type="text" 
                      value={o} 
                      onChange={(e) => handleOddsChange(i, e.target.value)}
                      className="flex-1 bg-surface-container-high border border-outline-variant/10 rounded-2xl p-4 text-xl font-bold text-on-surface outline-none focus:border-primary/50 transition-all shadow-inner"
                      placeholder="2.00"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Results Sidebar */}
            <div className="bg-surface-container rounded-2xl p-6 flex flex-col justify-center items-center text-center space-y-6 border border-outline-variant/10">
              {result ? (
                <>
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-colors ${result.isArbitrage ? 'bg-primary text-on-primary shadow-primary/20 animate-pulse' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                    <span className="material-symbols-outlined text-4xl">
                      {result.isArbitrage ? 'verified' : 'info'}
                    </span>
                  </div>
                  <div>
                    <h3 className={`text-2xl font-black tracking-tight ${result.isArbitrage ? 'text-primary' : 'text-on-surface-variant'}`}>
                      {result.isArbitrage ? 'Arbitrage Found!' : 'No Arbitrage'}
                    </h3>
                    <p className="text-xs uppercase tracking-widest font-bold opacity-60">
                        {result.isArbitrage ? `${result.arbitragePercentage.toFixed(2)}% ROI Possible` : 'Negative Expectation'}
                    </p>
                  </div>
                  
                  {result.isArbitrage && (
                    <div className="w-full pt-6 border-t border-outline-variant/10 space-y-6 text-left">
                        <div className="space-y-3">
                            {result.stakes.map((s, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase text-on-surface-variant">Outcome {i+1} Stake</span>
                                    <span className="text-sm font-bold text-on-surface">{formatCurrency(s)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="pt-4 border-t border-outline-variant/5">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-primary">Guaranteed Profit</span>
                                <span className="text-xl font-black text-primary">{formatCurrency(result.profit)}</span>
                            </div>
                        </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-on-surface-variant italic text-sm">Enter valid decimal odds to see results...</p>
              )}
            </div>
          </div>
        </section>

        <section className="mt-12 p-6 rounded-2xl bg-surface-container-highest/30 border border-outline-variant/5 text-xs text-on-surface-variant leading-relaxed">
            <h4 className="font-black uppercase tracking-widest mb-2 opacity-60">How it works</h4>
            <p>Arbitrage exists when the sum of the inverse of the best available odds for all outcomes is less than 1. This calculator finds the optimal stake for each outcome so that your total payout remains identical regardless of the match result.</p>
        </section>
      </div>
    </main>
  )
}
