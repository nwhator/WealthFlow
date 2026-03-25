import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SavingsForm from './SavingsForm'

export default async function SavingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: accounts } = await supabase.from('accounts').select('balance').eq('user_id', user.id).ilike('name', 'savings').single()
  const savingsBalance = accounts?.balance || 0

  const { data: logs } = await supabase
    .from('savings_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount).replace('NGN', '₦')
  }

  // Pre-configured simple goal
  const targetGoal = 200000
  const progressPercent = Math.min((savingsBalance / targetGoal) * 100, 100).toFixed(1)

  return (
    <main className="pt-24 pb-32 px-6 max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-on-surface">Savings & Goals</h2>
        <div className="text-right">
          <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Locked Savings</p>
          <p className="text-lg font-bold text-primary">{formatCurrency(savingsBalance)}</p>
        </div>
      </div>

      <div className="bg-surface-container-high p-6 rounded-2xl border border-outline-variant/10 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
         <div className="relative z-10">
           <div className="flex justify-between items-end mb-4">
             <div>
               <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Target Goal</p>
               <p className="font-black text-xl text-on-surface">{formatCurrency(targetGoal)}</p>
             </div>
             <p className="text-primary font-bold">{progressPercent}%</p>
           </div>
           
           <div className="w-full bg-surface-container rounded-full h-3 overflow-hidden">
             <div className="bg-primary h-3 rounded-full transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }}></div>
           </div>
           <p className="text-xs text-on-surface-variant mt-3 text-right">
             {savingsBalance >= targetGoal ? 'Goal Achieved! 🎉' : `${formatCurrency(targetGoal - savingsBalance)} left to reach your goal.`}
           </p>
         </div>
      </div>
      
      <SavingsForm />
      
      <section className="space-y-4">
        <h3 className="text-on-surface-variant text-[0.6875rem] uppercase tracking-[0.1em] font-bold">Lock History</h3>
        <div className="space-y-2">
          {(!logs || logs.length === 0) ? (
            <p className="text-on-surface-variant text-sm text-center py-6">No savings logged yet.</p>
          ) : (
            logs.map(log => (
              <div key={log.id} className="flex items-center justify-between p-4 bg-surface-container rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/10 text-primary">
                    <span className="material-symbols-outlined text-[20px]">lock_clock</span>
                  </div>
                  <div>
                    <p className="text-on-surface text-sm font-bold">{log.source}</p>
                    <p className="text-on-surface-variant text-[0.75rem]">Added to savings</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-primary">+{formatCurrency(log.amount)}</p>
                  <p className="text-xs text-on-surface-variant">{new Date(log.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  )
}
