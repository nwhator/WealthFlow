import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AccountsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: accounts } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', user.id)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount)
  }

  const netWorth = accounts?.reduce((acc, a) => acc + Number(a.balance), 0) || 0

  return (
    <main className="pt-24 pb-32 px-6 max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-on-surface">Accounts</h2>
        <h3 className="text-xl font-bold text-primary">{formatCurrency(netWorth).replace('NGN', '₦')}</h3>
      </div>
      
      <div className="space-y-4">
        {(!accounts || accounts.length === 0) ? (
          <p className="text-on-surface-variant text-sm text-center py-6">No accounts found.</p>
        ) : (
          accounts.map(acc => (
            <div key={acc.id} className="bg-surface-container-high p-6 rounded-2xl border border-outline-variant/10">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-bold text-on-surface">{acc.name}</h3>
                  <p className="text-on-surface-variant text-sm capitalize">{acc.name === 'Savings' ? 'Locked' : acc.name === 'Betting' ? 'Risk' : 'Cash'}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-on-surface">{formatCurrency(acc.balance).replace('NGN', '₦')}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Link href="/transactions" className="px-4 py-2 bg-surface-container hover:bg-surface-container-highest transition-colors rounded-lg text-sm font-bold text-on-surface-variant flex-1 text-center">
                  Transfer Funds
                </Link>
                {acc.name.toLowerCase() === 'betting' && (
                  <Link href="/betting" className="px-4 py-2 bg-primary/10 hover:bg-primary/20 transition-colors text-primary rounded-lg text-sm font-bold flex-1 text-center">
                    Place Bet
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  )
}
