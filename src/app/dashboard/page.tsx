import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch accounts
  const { data: accounts } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', user.id)

  const accountsList = accounts || []
  
  // Calculate Net Worth
  const netWorth = accountsList.reduce((acc, account) => acc + Number(account.balance), 0)

  // Fetch recent activity
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*, from_account:accounts!from_account_id(name), to_account:accounts!to_account_id(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const recentTransactions = transactions || []

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount)
  }

  // Find specific accounts for the cards
  const savingsAccount = accountsList.find(a => a.name.toLowerCase() === 'savings')
  const bettingAccount = accountsList.find(a => a.name.toLowerCase() === 'betting')
  const liquidityAccount = accountsList.find(a => a.name.toLowerCase() === 'liquidity')

  return (
    <main className="pt-24 pb-32 px-6 max-w-2xl mx-auto space-y-10">
      {/* Hero Section: Net Worth */}
      <section className="space-y-2">
        <p className="text-[0.6875rem] uppercase tracking-[0.1em] font-semibold text-on-surface-variant">TOTAL NET WORTH</p>
        <div className="flex flex-col gap-1">
          <h2 className="text-[3.5rem] leading-none font-black text-primary tracking-tight">
            {formatCurrency(netWorth).replace('NGN', '₦')}
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-on-surface-variant text-[0.75rem] font-medium tracking-wide">Updated just now</span>
          </div>
        </div>
      </section>

      {/* Horizontal Accounts Scroll */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-on-surface-variant text-[0.6875rem] uppercase tracking-[0.1em] font-bold">Accounts</h3>
          <Link href="/accounts" className="text-primary text-[0.75rem] font-medium">View All</Link>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6">
          
          {/* Savings Card */}
          <div className="min-w-[200px] bg-surface-container-high p-5 rounded-xl space-y-4 border border-outline-variant/10">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined">lock</span>
              </div>
              <span className="text-[10px] bg-outline-variant/20 text-on-surface-variant px-2 py-0.5 rounded uppercase font-bold tracking-wider">Locked</span>
            </div>
            <div>
              <p className="text-on-surface-variant text-[11px] font-medium uppercase tracking-wider">Savings</p>
              <p className="text-xl font-bold mt-1 text-on-surface">{formatCurrency(savingsAccount?.balance || 0).replace('NGN', '₦')}</p>
            </div>
          </div>

          {/* Betting Card */}
          <div className="min-w-[200px] bg-surface-container-high p-5 rounded-xl space-y-4 border border-outline-variant/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="flex justify-between items-start relative z-10">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">bolt</span>
              </div>
              <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded uppercase font-bold tracking-wider">Risk</span>
            </div>
            <div className="relative z-10">
              <p className="text-on-surface-variant text-[11px] font-medium uppercase tracking-wider">Betting</p>
              <p className="text-xl font-bold mt-1 text-on-surface">{formatCurrency(bettingAccount?.balance || 0).replace('NGN', '₦')}</p>
            </div>
          </div>

          {/* Liquidity Card */}
          <div className="min-w-[200px] bg-surface-container-high p-5 rounded-xl space-y-4 border border-outline-variant/10">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined">account_balance_wallet</span>
              </div>
              <span className="text-[10px] bg-secondary/10 text-secondary px-2 py-0.5 rounded uppercase font-bold tracking-wider">Cash</span>
            </div>
            <div>
              <p className="text-on-surface-variant text-[11px] font-medium uppercase tracking-wider">Liquidity</p>
              <p className="text-xl font-bold mt-1 text-on-surface">{formatCurrency(liquidityAccount?.balance || 0).replace('NGN', '₦')}</p>
            </div>
          </div>
          
        </div>
      </section>

      {/* Recent Activity */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-on-surface-variant text-[0.6875rem] uppercase tracking-[0.1em] font-bold">Recent Activity</h3>
          <Link href="/transactions" className="text-primary text-[0.75rem] font-medium">History</Link>
        </div>
        <div className="space-y-2">
          {recentTransactions.length === 0 ? (
            <p className="text-on-surface-variant text-sm text-center py-6">No recent transactions.</p>
          ) : (
            recentTransactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between p-4 bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ${
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
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">{tx.type}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
      
      {/* Contextual FAB */}
      <Link href="/transactions" className="fixed bottom-28 right-6 w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg shadow-primary/20 flex items-center justify-center active:scale-90 transition-all z-40">
        <span className="material-symbols-outlined text-[32px] font-bold">add</span>
      </Link>
    </main>
  )
}
