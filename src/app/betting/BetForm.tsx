'use client'

import { useState } from 'react'
import { addBet } from './actions'

export default function BetForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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
    <div className="bg-surface-container-high p-6 rounded-2xl border border-outline-variant/10">
      <h3 className="text-lg font-bold mb-4 text-on-surface">Log New Bet</h3>
      
      {error && <div className="text-on-error bg-error-container p-3 rounded-md mb-4 text-sm">{error}</div>}

      <form action={handleSubmit} className="space-y-4">
        <div>
           <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Match / Event</label>
           <input type="text" name="match" required className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-3 outline-none focus:border-primary text-on-surface" placeholder="e.g. Man City vs Arsenal" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
             <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Odds</label>
             <input type="number" step="0.01" name="odds" required className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-3 outline-none focus:border-primary text-on-surface" placeholder="2.50" />
          </div>
          <div>
             <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Stake (₦)</label>
             <input type="number" step="0.01" name="stake" required className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-3 outline-none focus:border-primary text-on-surface" placeholder="1000" />
          </div>
        </div>

        <div>
           <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Bookmaker</label>
           <input type="text" name="bookmaker" required className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-3 outline-none focus:border-primary text-on-surface" placeholder="1xBet" />
        </div>

        <button type="submit" disabled={loading} className="w-full py-3 bg-primary text-on-primary font-bold rounded-xl active:scale-95 transition-transform mt-2 disabled:opacity-50">
          {loading ? 'Logging...' : 'Log Bet'}
        </button>
      </form>
    </div>
  )
}
