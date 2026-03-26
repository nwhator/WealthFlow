import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getSubscription } from '@/lib/subscription'
import CheckoutButton from '@/components/CheckoutButton'
import Link from 'next/link'

const MONTHLY_PRICE_ID = process.env.NEXT_PUBLIC_PADDLE_MONTHLY_PRICE_ID!
const YEARLY_PRICE_ID = process.env.NEXT_PUBLIC_PADDLE_YEARLY_PRICE_ID!

export default async function PricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const sub = await getSubscription(user?.id)
  const isPremium = sub.plan === 'premium'

  return (
    <main className="min-h-screen bg-surface-dim pt-32 pb-32 px-6">
      <div className="max-w-screen-xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Simple Transparent Pricing</span>
          <h1 className="text-6xl font-black text-on-surface tracking-tighter leading-none">Choose Your Plan</h1>
          <p className="text-on-surface-variant text-lg max-w-2xl mx-auto leading-relaxed">
            Unlock professional-grade betting intelligence and real-time arbitrage detection.
          </p>
        </div>

        {isPremium && (
          <div className="mb-12 max-w-2xl mx-auto p-8 rounded-2xl bg-primary/10 border border-primary/20 backdrop-blur-sm flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-on-primary">
                <span className="material-symbols-outlined text-3xl font-black">check_circle</span>
              </div>
              <div>
                <h3 className="text-xl font-black text-on-surface leading-none mb-2">Pro Plan Active</h3>
                <p className="text-on-surface-variant text-sm font-medium">Valid until {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
            <Link href="/dashboard" className="px-8 py-3 bg-on-surface text-surface rounded-full font-black text-xs uppercase tracking-widest hover:bg-on-surface/90 transition-all">Go to Dashboard</Link>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Monthly Plan */}
          <div className={`relative p-10 rounded-3xl border transition-all duration-500 overflow-hidden ${!isPremium ? 'bg-surface-container-low border-outline-variant/10 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5' : 'bg-surface-container-high border-outline-variant/10 opacity-70 cursor-not-allowed grayscale'}`}>
            <div className="relative z-10 flex flex-col h-full">
              <div className="mb-10">
                <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-black block mb-4">Flexible Access</span>
                <h3 className="text-3xl font-black text-on-surface mb-2 tracking-tight">Pro Monthly</h3>
                <div className="flex items-end gap-1 mb-8">
                  <span className="text-5xl font-black text-primary">$25</span>
                  <span className="text-on-surface-variant font-black text-sm pb-2">/ month</span>
                </div>
                
                <ul className="space-y-4 mb-10">
                    <FeatureItem label="AI Betting Predictions" />
                    <FeatureItem label="All Arbitrage Markets" />
                    <FeatureItem label="Bankroll Tracking" />
                    <FeatureItem label="Global Market Access (NG/EU/US)" />
                </ul>
              </div>

              {user ? (
                !isPremium ? (
                  <CheckoutButton 
                    priceId={MONTHLY_PRICE_ID} 
                    userId={user.id} 
                    userEmail={user.email!}
                    className="mt-auto w-full py-5 bg-on-surface text-surface rounded-2xl font-black text-sm uppercase tracking-[0.1em] hover:bg-on-surface/90 transition-all active:scale-95 text-center shadow-xl shadow-surface-container-highest/20"
                  />
                ) : (
                  <button disabled className="mt-auto w-full py-5 bg-surface-container-highest text-on-surface-variant rounded-2xl font-black text-sm uppercase cursor-not-allowed">Active Plan</button>
                )
              ) : (
                <Link href="/login" className="mt-auto w-full py-5 bg-on-surface text-surface rounded-2xl font-black text-sm uppercase tracking-[0.1em] hover:bg-on-surface/90 transition-all text-center">Sign in to Subscribe</Link>
              )}
            </div>
          </div>

          {/* Yearly Plan */}
          <div className={`relative p-10 rounded-3xl border transition-all duration-500 overflow-hidden ${!isPremium ? 'bg-surface-container-high border-primary shadow-2xl shadow-primary/10' : 'bg-surface-container-high border-outline-variant/10 opacity-70 cursor-not-allowed grayscale'}`}>
            <div className="absolute top-0 right-10 bg-primary text-on-primary px-6 py-2.5 rounded-b-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 animate-pulse">
                BEST VALUE: SAVE $50
            </div>
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="mb-10 pt-4">
                <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-black block mb-4">Annual Commitment</span>
                <h3 className="text-3xl font-black text-on-surface mb-2 tracking-tight">Pro Yearly</h3>
                <div className="flex items-end gap-1 mb-8">
                  <span className="text-5xl font-black text-primary">$250</span>
                  <span className="text-on-surface-variant font-black text-sm pb-2">/ year</span>
                </div>
                
                <ul className="space-y-4 mb-10">
                    <FeatureItem label="Everything in Monthly" />
                    <FeatureItem label="VIP Strategy Reports" />
                    <FeatureItem label="Priority Support Desk" />
                    <FeatureItem label="Locked-in Renewal Price" />
                </ul>
              </div>

              {user ? (
                !isPremium ? (
                  <CheckoutButton 
                    priceId={YEARLY_PRICE_ID} 
                    userId={user.id} 
                    userEmail={user.email!}
                    className="mt-auto w-full py-5 bg-primary text-on-primary rounded-2xl font-black text-sm uppercase tracking-[0.1em] hover:bg-primary/90 transition-all active:scale-95 text-center shadow-xl shadow-primary/20"
                  />
                ) : (
                  <button disabled className="mt-auto w-full py-5 bg-surface-container-highest text-on-surface-variant rounded-2xl font-black text-sm uppercase cursor-not-allowed">Active Plan</button>
                )
              ) : (
                <Link href="/login" className="mt-auto w-full py-5 bg-primary text-on-primary rounded-2xl font-black text-sm uppercase tracking-[0.1em] hover:bg-primary/90 transition-all text-center">Sign in to Subscribe</Link>
              )}
            </div>
          </div>
        </div>

        <div className="mt-24 pt-12 border-t border-outline-variant/10 flex flex-wrap justify-between gap-8 max-w-4xl mx-auto">
            <div className="max-w-xs space-y-4">
                <h4 className="text-lg font-black text-on-surface tracking-tight leading-none uppercase tracking-widest text-xs opacity-40">Payment & Security</h4>
                <p className="text-sm text-on-surface-variant leading-relaxed">Payments are processed securely via **Paddle**, our official Merchant of Record. We accept cards, Apple Pay, and Google Pay globally, including Nigeria.</p>
            </div>
            <div className="flex flex-col gap-3">
                <h4 className="text-lg font-black text-on-surface tracking-tight leading-none uppercase tracking-widest text-xs opacity-40">Support & Legal</h4>
                <Link href="/terms" className="text-sm text-on-surface-variant hover:text-primary transition-colors hover:underline">Terms of Service</Link>
                <Link href="/privacy" className="text-sm text-on-surface-variant hover:text-primary transition-colors hover:underline">Privacy Policy</Link>
                <Link href="/refund" className="text-sm text-on-surface-variant hover:text-primary transition-colors hover:underline">Refund Policy</Link>
            </div>
        </div>
      </div>
    </main>
  )
}

function FeatureItem({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-4 text-on-surface/90">
      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
        <span className="material-symbols-outlined text-[14px] font-black text-primary">done</span>
      </div>
      <span className="font-bold text-sm tracking-tight">{label}</span>
    </li>
  )
}
