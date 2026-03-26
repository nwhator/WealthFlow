import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUserPlan } from '@/lib/subscription'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const plan = await getUserPlan(user.id)
  const isPremium = plan === 'premium'

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
    .limit(4)

  const recentTransactions = transactions || []

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount)
  }

  // Find specific accounts for the cards
  const savingsAccount = accountsList.find(a => a.name.toLowerCase() === 'savings')
  const bettingAccount = accountsList.find(a => a.name.toLowerCase() === 'betting')
  const liquidityAccount = accountsList.find(a => a.name.toLowerCase() === 'liquidity')

  return (
    <main className="pt-24 pb-32 px-4 sm:px-6 max-w-4xl mx-auto space-y-12">
      
      {/* ── Hero section: Net Worth ────────────────────── */}
      <section className="relative px-8 py-10 bg-gradient-to-br from-surface-container-high via-surface-container-low to-surface-container-low rounded-[2rem] border border-outline-variant/10 shadow-2xl shadow-primary/5 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <p className="text-[10px] uppercase tracking-[0.2em] font-black text-on-surface-variant">Total Portfolio Net Worth</p>
            </div>
            <h2 className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-on-surface to-on-surface/80 tracking-tighter">
              {formatCurrency(netWorth).replace('NGN', '₦')}
            </h2>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-on-surface-variant text-[10px] font-bold tracking-widest uppercase">Live sync active</span>
            </div>
          </div>
          
          <Link href="/transactions" className="shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 group">
            <span className="material-symbols-outlined font-black transition-transform group-hover:rotate-90">add</span>
          </Link>
        </div>
      </section>

      {/* ── Accounts ────────────────────────────────────── */}
      <section className="space-y-5">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-on-surface-variant text-[10px] uppercase tracking-[0.2em] font-black">Capital Allocation</h3>
          <Link href="/accounts" className="text-primary text-[10px] uppercase tracking-widest font-black flex items-center gap-1 hover:underline">
            View All <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Liquidity */}
          <AccountCard 
            title="Overview" 
            label="Cash Liquidity" 
            balance={liquidityAccount?.balance} 
            icon="account_balance_wallet"
            tint="secondary"
          />

          {/* Savings */}
          <AccountCard 
            title="Vault" 
            label="Secured Savings" 
            balance={savingsAccount?.balance} 
            icon="lock"
            tint="emerald"
          />

          {/* Betting */}
          <AccountCard 
            title="Capital" 
            label="Active Betting" 
            balance={bettingAccount?.balance} 
            icon="bolt"
            tint="primary"
          />

        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* ── Recent Activity ─────────────────────────────── */}
        <section className="space-y-5">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-on-surface-variant text-[10px] uppercase tracking-[0.2em] font-black">Recent Activity</h3>
            <Link href="/transactions" className="text-primary text-[10px] uppercase tracking-widest font-black hover:underline">History</Link>
          </div>
          <div className="space-y-3">
            {recentTransactions.length === 0 ? (
              <div className="bg-surface-container-low rounded-2xl border border-dashed border-outline-variant/20 p-8 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-30">history</span>
                <p className="text-[10px] uppercase tracking-widest font-bold">No recent transactions</p>
              </div>
            ) : (
              recentTransactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl border border-outline-variant/5 hover:border-outline-variant/20 transition-all hover:shadow-lg hover:shadow-primary/5 group">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-105 ${
                      tx.type === 'income' ? 'bg-primary/10 text-primary' : 
                      tx.type === 'expense' ? 'bg-red-500/10 text-red-500' : 
                      'bg-secondary/10 text-secondary'
                    }`}>
                      <span className="material-symbols-outlined font-black">
                        {tx.type === 'income' ? 'south_west' : tx.type === 'expense' ? 'north_east' : 'sync_alt'}
                      </span>
                    </div>
                    <div>
                      <p className="text-on-surface text-sm font-bold capitalize leading-none mb-1.5">{tx.type} {tx.note ? `- ${tx.note}` : ''}</p>
                      <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                        {tx.type === 'transfer' ? `To ${(tx.to_account as {name?: string})?.name}` : tx.type}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-black tracking-tight ${tx.type === 'income' ? 'text-primary' : tx.type === 'expense' ? 'text-red-400' : 'text-on-surface'}`}>
                      {tx.type === 'expense' ? '-' : tx.type === 'income' ? '+' : ''}{formatCurrency(tx.amount).replace('NGN', '₦')}
                    </p>
                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
                      {new Date(tx.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ── Top Pick / Premium Teaser ───────────────────── */}
        <section className="space-y-5">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-on-surface-variant text-[10px] uppercase tracking-[0.2em] font-black">Intelligence</h3>
            <Link href="/predictions" className="text-primary text-[10px] uppercase tracking-widest font-black hover:underline">View Picks</Link>
          </div>
          <TopPickSection supabase={supabase} isPremium={isPremium} />
        </section>
      </div>

    </main>
  )
}

function AccountCard({ title, label, balance, icon, tint }: { title: string, label: string, balance: number | undefined, icon: string, tint: 'primary' | 'secondary' | 'emerald' }) {
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount).replace('NGN', '₦')
  
  const tintMap = {
    primary: { ring: 'ring-primary/20', bg: 'bg-primary/5', text: 'text-primary', badge: 'bg-primary/10 text-primary border-primary/20' },
    secondary: { ring: 'ring-secondary/20', bg: 'bg-secondary/5', text: 'text-secondary', badge: 'bg-secondary/10 text-secondary border-secondary/20' },
    emerald: { ring: 'ring-emerald-500/20', bg: 'bg-emerald-500/5', text: 'text-emerald-500', badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  }
  const theme = tintMap[tint]

  return (
    <div className={`relative bg-surface-container-low p-6 rounded-[1.5rem] border border-outline-variant/10 ring-1 ${theme.ring} hover:scale-[1.02] transition-transform duration-300 overflow-hidden group`}>
      {/* Subtle shine */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex justify-between items-start mb-6">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${theme.bg} ${theme.text}`}>
          <span className="material-symbols-outlined text-[20px] font-black">{icon}</span>
        </div>
        <span className={`text-[8px] px-2 py-1 rounded-md uppercase font-black tracking-widest border ${theme.badge}`}>
          {title}
        </span>
      </div>
      <div>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-black text-on-surface tracking-tighter">
          {formatCurrency(balance || 0)}
        </p>
      </div>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function TopPickSection({ supabase, isPremium }: { supabase: any; isPremium: boolean }) {
  if (!isPremium) {
    return (
      <div className="relative rounded-[1.5rem] bg-surface-container-low border border-outline-variant/10 p-6 overflow-hidden min-h-[180px] flex flex-col justify-center ring-1 ring-primary/20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 pointer-events-none" />
        
        {/* Blurred background content */}
        <div className="blur border border-outline-variant/10 rounded-xl p-4 opacity-50 select-none pointer-events-none" aria-hidden>
          <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">Football</p>
          <p className="font-bold text-on-surface text-lg">Liverpool vs Arsenal</p>
          <p className="text-primary font-bold mt-2">Home Win (2.15)</p>
        </div>

        {/* Lock overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-container/40 backdrop-blur-[2px]">
          <span className="material-symbols-outlined text-3xl text-primary mb-3">lock</span>
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">Pro Feature Locked</p>
          <Link href="/pricing" className="px-6 py-2.5 bg-primary text-on-primary rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:scale-105 active:scale-95">
            Upgrade Now
          </Link>
        </div>
      </div>
    )
  }

  const { data: pick } = await supabase
    .from('predictions_cache')
    .select('match, prediction, confidence, odds, sport, market')
    .order('confidence', { ascending: false })
    .limit(1)
    .single()

  if (!pick) {
    return (
      <div className="rounded-[1.5rem] bg-surface-container-low border border-dashed border-outline-variant/20 p-8 text-center text-on-surface-variant flex flex-col items-center justify-center min-h-[180px]">
        <span className="material-symbols-outlined text-4xl mb-2 opacity-30">analytics</span>
        <p className="text-[10px] uppercase tracking-widest font-bold">Engine analyzing markets...</p>
      </div>
    )
  }

  const isGold = pick.confidence >= 70
  const colorClass = isGold ? 'text-primary' : pick.confidence >= 50 ? 'text-yellow-400' : 'text-zinc-400'
  const bgClass = isGold ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-surface-container-highest border-outline-variant/10 text-on-surface-variant'

  return (
    <div className={`relative rounded-[1.5rem] bg-surface-container-low border border-outline-variant/10 p-6 overflow-hidden ring-1 ${isGold ? 'ring-primary/20 hover:shadow-2xl hover:shadow-primary/10' : 'ring-outline-variant/10 hover:shadow-xl hover:shadow-black/5'} transition-all group`}>
       {isGold && <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />}

      <div className="flex justify-between items-start mb-4">
        <div>
          <span className={`text-[8px] px-2 py-0.5 rounded-md font-black uppercase tracking-widest border ${bgClass}`}>
            {isGold ? 'Daily Gold Pick' : 'Top Recommendation'}
          </span>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-2 flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isGold ? 'bg-primary' : 'bg-yellow-400'}`} />
            {pick.sport}
          </p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black ${isGold ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'bg-surface-container-highest text-on-surface'}`}>
          {pick.confidence}%
        </div>
      </div>
      
      <p className="font-bold text-on-surface text-lg leading-snug mb-4">{pick.match}</p>
      
      <div className="bg-surface-container-highest/40 rounded-xl p-4 border border-outline-variant/5">
        <p className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Engine Verdict</p>
        <div className="flex items-center justify-between">
          <p className={`font-black tracking-tight ${colorClass}`}>{pick.prediction}</p>
          <span className="text-[10px] font-mono text-zinc-400">Odds: <span className="font-black text-on-surface text-sm">{Number(pick.odds).toFixed(2)}</span></span>
        </div>
      </div>
    </div>
  )
}
