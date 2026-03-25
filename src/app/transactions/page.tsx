import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TransactionForm from './TransactionForm'

export default async function TransactionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: accounts } = await supabase.from('accounts').select('id, name').eq('user_id', user.id)
  
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*, from_account:accounts!from_account_id(name), to_account:accounts!to_account_id(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount)
  }

  return (
    <main className="pt-24 pb-32 px-6 max-w-2xl mx-auto space-y-8">
      <h2 className="text-2xl font-black text-on-surface">Transactions</h2>
      
      <TransactionForm accounts={accounts || []} />

      <section className="space-y-4">
        <h3 className="text-on-surface-variant text-[0.6875rem] uppercase tracking-[0.1em] font-bold">All Activity</h3>
        <div className="space-y-2">
          {(!transactions || transactions.length === 0) ? (
            <p className="text-on-surface-variant text-sm text-center py-6">No transactions yet.</p>
          ) : (
            transactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between p-4 bg-surface-container rounded-xl">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    tx.type === 'income' ? 'bg-primary/10 text-primary' : 
                    tx.type === 'expense' ? 'bg-tertiary-container/10 text-tertiary-container' : 
                    'bg-secondary/10 text-secondary'
                  }`}>
                    <span className="material-symbols-outlined">
                      {tx.type === 'income' ? 'arrow_downward' : tx.type === 'expense' ? 'arrow_upward' : 'swap_horiz'}
                    </span>
                  </div>
                  <div>
                    <p className="text-on-surface text-sm font-bold capitalize">{tx.type} {tx.note ? `- ${tx.note}` : ''}</p>
                    <p className="text-on-surface-variant text-[0.75rem]">
                      {tx.type === 'transfer' ? `From ${(tx.from_account as {name?: string})?.name} to ${(tx.to_account as {name?: string})?.name}` : ((tx.from_account as {name?: string})?.name || (tx.to_account as {name?: string})?.name || 'Account')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black ${tx.type === 'income' ? 'text-primary' : tx.type === 'expense' ? 'text-on-tertiary-fixed-variant' : 'text-on-surface'}`}>
                    {tx.type === 'expense' ? '-' : tx.type === 'income' ? '+' : ''}{formatCurrency(tx.amount).replace('NGN', '₦')}
                  </p>
                  <p className="text-xs text-on-surface-variant">{new Date(tx.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  )
}
