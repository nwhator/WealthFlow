import { createClient } from '@/lib/supabase/server'
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
    <main className="min-h-screen bg-surface-dim pt-32 pb-32 px-4 sm:px-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -mr-20 -mt-20" />
      <div className="absolute top-40 left-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none -ml-20" />

      <div className="max-w-screen-xl mx-auto relative z-10">
        
        {/* ── Header ────────────────────────────────────────── */}
        <div className="text-center mb-16 space-y-5">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Simple Transparent Pricing
            </span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-on-surface to-on-surface/80 tracking-tighter leading-none">
            Choose Your Plan
          </h1>
          <p className="text-on-surface-variant text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Unlock professional-grade betting intelligence and real-time arbitrage detection across global markets.
          </p>
        </div>

        {/* ── Active Plan Toast ───────────────────────────── */}
        {isPremium && (
          <div className="mb-16 max-w-2xl mx-auto p-6 sm:p-8 rounded-[2rem] bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl shadow-primary/5 ring-1 ring-primary/10">
            <div className="flex items-center gap-6 text-center sm:text-left">
              <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-on-primary shadow-lg shadow-primary/20 shrink-0">
                <span className="material-symbols-outlined text-[32px] font-black">check_circle</span>
              </div>
              <div>
                <h3 className="text-2xl font-black text-on-surface leading-none mb-1.5">Pro Plan Active</h3>
                <p className="text-on-surface-variant text-[11px] font-bold uppercase tracking-widest">
                  Valid until <span className="text-primary">{sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : 'N/A'}</span>
                </p>
              </div>
            </div>
            <Link href="/dashboard" className="px-8 py-3.5 bg-on-surface text-surface rounded-full font-black text-[10px] uppercase tracking-[0.2em] hover:bg-on-surface/90 transition-all shadow-xl active:scale-95 whitespace-nowrap">
              Go to Dashboard
            </Link>
          </div>
        )}

        {/* ── Pricing Cards ───────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* Monthly Plan */}
          <div className={`group relative p-8 sm:p-10 rounded-[2.5rem] border transition-all duration-500 overflow-hidden ${!isPremium ? 'bg-surface-container-low border-outline-variant/10 hover:border-primary/20 hover:ring-1 hover:ring-primary/20 hover:shadow-2xl hover:shadow-primary/5' : 'bg-surface-container-high border-outline-variant/10 opacity-60 cursor-not-allowed grayscale'}`}>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="mb-10">
                <span className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-black block mb-4">Flexible Access</span>
                <h3 className="text-4xl font-black text-on-surface mb-2 tracking-tight">Pro Monthly</h3>
                <div className="flex items-end gap-1.5 mb-8">
                  <span className="text-6xl font-black text-primary tracking-tighter">$25</span>
                  <span className="text-zinc-500 font-bold text-xs pb-3 uppercase tracking-widest">/ mo</span>
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
                    className="mt-auto w-full py-5 bg-surface-container-highest border border-outline-variant/20 text-on-surface rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-surface-container-high transition-all active:scale-[0.98] text-center"
                  />
                ) : (
                  <button disabled className="mt-auto w-full py-5 bg-surface-container-highest border border-outline-variant/10 text-on-surface-variant rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] cursor-not-allowed">Active</button>
                )
              ) : (
                <Link href="/login" className="mt-auto w-full py-5 bg-surface-container-highest border border-outline-variant/20 text-on-surface rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-surface-container-high transition-all active:scale-[0.98] text-center block">Sign in to Subscribe</Link>
              )}
            </div>
          </div>

          {/* Yearly Plan */}
          <div className={`relative p-8 sm:p-10 rounded-[2.5rem] border transition-all duration-500 overflow-hidden ${!isPremium ? 'bg-gradient-to-b from-surface-container-low to-surface-container-high border-primary/30 ring-1 ring-primary/20 shadow-2xl shadow-primary/10 hover:shadow-primary/20 hover:-translate-y-1' : 'bg-surface-container-high border-outline-variant/10 opacity-60 cursor-not-allowed grayscale'}`}>
            <div className="absolute top-0 right-10 bg-gradient-to-r from-primary to-primary/80 text-on-primary px-6 py-2.5 rounded-b-2xl text-[9px] font-black uppercase tracking-[0.25em] shadow-lg shadow-primary/20">
              BEST VALUE: SAVE $50
            </div>
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="mb-10 pt-4">
                <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-black block mb-4">Annual Commitment</span>
                <h3 className="text-4xl font-black text-on-surface mb-2 tracking-tight">Pro Yearly</h3>
                <div className="flex items-end gap-1.5 mb-8">
                  <span className="text-6xl font-black text-primary tracking-tighter">$250</span>
                  <span className="text-zinc-500 font-bold text-xs pb-3 uppercase tracking-widest">/ yr</span>
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
                  <div className="mt-auto relative group">
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-2xl transition-opacity group-hover:opacity-100 opacity-0" />
                    <CheckoutButton 
                      priceId={YEARLY_PRICE_ID} 
                      userId={user.id} 
                      userEmail={user.email!}
                      className="relative w-full py-5 bg-primary text-on-primary rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-primary/90 transition-all active:scale-[0.98] text-center shadow-xl shadow-primary/20"
                    />
                  </div>
                ) : (
                  <button disabled className="mt-auto w-full py-5 bg-surface-container-highest border border-outline-variant/10 text-on-surface-variant rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] cursor-not-allowed">Active</button>
                )
              ) : (
                <div className="mt-auto relative group">
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-2xl transition-opacity group-hover:opacity-100 opacity-0" />
                  <Link href="/login" className="relative block w-full py-5 bg-primary text-on-primary rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-primary/90 transition-all active:scale-[0.98] text-center shadow-xl shadow-primary/20">Sign in to Subscribe</Link>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ── Footer Info ─────────────────────────────────── */}
        <div className="mt-32 pt-16 border-t border-outline-variant/10 flex flex-wrap justify-between gap-12 max-w-4xl mx-auto">
          <div className="max-w-sm space-y-4">
            <h4 className="font-black text-on-surface tracking-widest uppercase text-[10px] bg-surface-container-highest w-fit px-3 py-1 rounded border border-outline-variant/10">Payment & Security</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">Payments are processed securely via <strong className="text-on-surface">Paddle</strong>, our official Merchant of Record. We accept cards, Apple Pay, and Google Pay globally.</p>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="font-black text-on-surface tracking-widest uppercase text-[10px] bg-surface-container-highest w-fit px-3 py-1 rounded border border-outline-variant/10">Support & Legal</h4>
            <Link href="/terms" className="text-xs font-bold text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2 group"><span className="w-1 h-1 rounded-full bg-primary/50 group-hover:bg-primary transition-colors"/> Terms of Service</Link>
            <Link href="/privacy" className="text-xs font-bold text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2 group"><span className="w-1 h-1 rounded-full bg-primary/50 group-hover:bg-primary transition-colors"/> Privacy Policy</Link>
            <Link href="/refund" className="text-xs font-bold text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2 group"><span className="w-1 h-1 rounded-full bg-primary/50 group-hover:bg-primary transition-colors"/> Refund Policy</Link>
          </div>
        </div>
      </div>
    </main>
  )
}

function FeatureItem({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-4 text-on-surface">
      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
        <span className="material-symbols-outlined text-[14px] font-black text-on-primary">done</span>
      </div>
      <span className="font-bold text-sm tracking-tight">{label}</span>
    </li>
  )
}
