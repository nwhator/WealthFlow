'use client'

import { useState, useEffect, useRef } from 'react'
import { addBet } from './actions'

export default function BetForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const matchRef = useRef<HTMLInputElement>(null)
  const oddsRef = useRef<HTMLInputElement>(null)
  const stakeRef = useRef<HTMLInputElement>(null)
  const bookmakerRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleFill = (e: any) => {
      if (matchRef.current) matchRef.current.value = e.detail.match || '';
      if (oddsRef.current) oddsRef.current.value = e.detail.odds?.toFixed(2) || '';
      if (stakeRef.current) stakeRef.current.value = Math.floor(e.detail.suggestedStake).toString() || '';
      if (bookmakerRef.current) bookmakerRef.current.value = e.detail.bookmaker || '';
      
      const formEl = document.getElementById('bet-form');
      if (formEl) window.scrollTo({ top: formEl.offsetTop - 100, behavior: 'smooth' });
    };
    
    // @ts-ignore
    window.addEventListener('fillBetForm', handleFill);
    // @ts-ignore
    return () => window.removeEventListener('fillBetForm', handleFill);
  }, []);

  async function handleSubmit(formData: FormData) {
    setError(null)
    setLoading(true)
    const res = await addBet(formData)
    setLoading(false)
    if (res.error) {
      setError(res.error)
    } else {
      window.location.reload()
    }
  }

  return (
    <div id="bet-form" className="bg-surface-container-high p-6 rounded-2xl border border-outline-variant/10">
      <h3 className="text-lg font-bold mb-4 text-on-surface">Log New Bet</h3>
      
      {error && <div className="text-on-error bg-error-container p-3 rounded-md mb-4 text-sm">{error}</div>}

      <form action={handleSubmit} className="space-y-4">
        <div>
           <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Match / Event</label>
           <input ref={matchRef} type="text" name="match" required className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-3 outline-none focus:border-primary text-on-surface" placeholder="e.g. Man City vs Arsenal" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
             <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Odds</label>
             <input ref={oddsRef} type="number" step="0.01" name="odds" required className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-3 outline-none focus:border-primary text-on-surface" placeholder="2.50" />
          </div>
          <div>
             <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Stake (₦)</label>
             <input ref={stakeRef} type="number" step="0.01" name="stake" required className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-3 outline-none focus:border-primary text-on-surface" placeholder="1000" />
          </div>
        </div>

        <div>
           <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Bookmaker</label>
           <input ref={bookmakerRef} type="text" name="bookmaker" required className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-3 outline-none focus:border-primary text-on-surface" placeholder="1xBet" />
        </div>

        <button type="submit" disabled={loading} className="w-full py-3 bg-primary text-on-primary font-bold rounded-xl active:scale-95 transition-transform mt-2 disabled:opacity-50">
          {loading ? 'Logging...' : 'Log Bet'}
        </button>
      </form>
    </div>
  )
}
