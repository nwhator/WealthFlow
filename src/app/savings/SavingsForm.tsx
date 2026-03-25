'use client'

import { useState } from 'react'
import { addSavings } from './actions'

export default function SavingsForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setError(null)
    setLoading(true)
    const res = await addSavings(formData)
    setLoading(false)
    if (res.error) {
      setError(res.error)
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="bg-surface-container-high p-6 rounded-2xl border border-outline-variant/10">
      <h3 className="text-lg font-bold mb-4 text-on-surface">Lock Savings</h3>
      <p className="text-xs text-on-surface-variant mb-4">Transfer from Liquidity to locked Savings.</p>
      
      {error && <div className="text-on-error bg-error-container p-3 rounded-md mb-4 text-sm">{error}</div>}

      <form action={handleSubmit} className="space-y-4">
        <div>
           <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Amount (₦)</label>
           <input type="number" step="0.01" name="amount" required className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-3 outline-none focus:border-primary text-on-surface" placeholder="5000" />
        </div>
        
        <div>
           <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Source / Note</label>
           <input type="text" name="source" required className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-3 outline-none focus:border-primary text-on-surface" placeholder="e.g. Freelance project" />
        </div>

        <button type="submit" disabled={loading} className="w-full py-3 bg-primary text-on-primary font-bold rounded-xl active:scale-95 transition-transform mt-2 disabled:opacity-50 flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[18px]">lock</span>
          {loading ? 'Locking...' : 'Lock Funds'}
        </button>
      </form>
    </div>
  )
}
