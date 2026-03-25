'use client'

import { useState } from 'react'
import { addTransaction } from './actions'

type Account = { id: string, name: string }

export default function TransactionForm({ accounts }: { accounts: Account[] }) {
  const [type, setType] = useState('expense')
  const [error, setError] = useState<string | null>(null)
  
  async function handleSubmit(formData: FormData) {
    setError(null)
    const result = await addTransaction(formData)
    if (result.error) {
      setError(result.error)
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="bg-surface-container-high p-6 rounded-2xl border border-outline-variant/10">
      <h3 className="text-lg font-bold mb-4">Add Transaction</h3>
      
      {error && <div className="text-on-error bg-error-container p-3 rounded-md mb-4 text-sm">{error}</div>}

      <form action={handleSubmit} className="space-y-4">
        <div className="flex bg-surface-container rounded-lg p-1 gap-1">
          {['expense', 'income', 'transfer'].map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 py-2 text-sm font-bold rounded-md capitalize transition-colors ${type === t ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-highest'}`}
            >
              {t}
            </button>
          ))}
        </div>
        
        <input type="hidden" name="type" value={type} />

        <div>
          <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Amount (₦)</label>
          <input type="number" step="0.01" name="amount" required className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-3 outline-none focus:border-primary" placeholder="0.00" />
        </div>

        {type !== 'income' && (
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">From Account</label>
            <select name="from_account" required className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-3 outline-none focus:border-primary">
              <option value="">Select account</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        )}

        {type !== 'expense' && (
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">To Account</label>
            <select name="to_account" required className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-3 outline-none focus:border-primary">
              <option value="">Select account</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        )}

        <div>
           <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Note (Optional)</label>
           <input type="text" name="note" className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-3 outline-none focus:border-primary" placeholder="What was this for?" />
        </div>

        <button type="submit" className="w-full py-3 bg-primary text-on-primary font-bold rounded-xl active:scale-95 transition-transform mt-2">
          Save Transaction
        </button>
      </form>
    </div>
  )
}
