import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BetForm from './BetForm'
import BetList from './BetList'

export default async function BettingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: accounts } = await supabase.from('accounts').select('balance').eq('user_id', user.id).ilike('name', 'betting').single()
  const bettingBalance = accounts?.balance || 0

  const { data: bets } = await supabase
    .from('bets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount).replace('NGN', '₦')
  }

  return (
    <main className="pt-24 pb-32 px-6 max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-on-surface">Betting</h2>
        <div className="text-right">
          <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Bankroll</p>
          <p className="text-lg font-bold text-primary">{formatCurrency(bettingBalance)}</p>
        </div>
      </div>
      
      <BetForm />
      
      <section className="space-y-4">
        <h3 className="text-on-surface-variant text-[0.6875rem] uppercase tracking-[0.1em] font-bold">Bet History</h3>
        <BetList bets={bets || []} />
      </section>
    </main>
  )
}
