import Link from 'next/link'

export default function TermsPage() {
  return (
    <main className="pt-32 pb-32 px-6 max-w-3xl mx-auto space-y-12">
      <div className="space-y-4">
        <h1 className="text-4xl font-black text-on-surface tracking-tight">Terms of Service</h1>
        <p className="text-on-surface-variant text-sm uppercase tracking-widest font-bold">Last Updated: March 26, 2026</p>
      </div>

      <div className="space-y-10 text-on-surface-variant leading-relaxed">
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-on-surface">1. Agreement to Terms</h2>
          <p>
            By accessing or using WealthFlow Pro (“the Platform”), you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-on-surface">2. Description of Service</h2>
          <p>
            WealthFlow Pro provides betting intelligence, AI-assisted predictions, and arbitrage market tracking. Our service is informational only. **We are not a bookmaker or a betting platform.**
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-on-surface">3. Subscriptions & Payments</h2>
          <p>
            Subscriptions are processed via Paddle, our Merchant of Record. Payments are recurring until cancelled. You can manage your subscription at any time via the Paddle billing portal available in your settings.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-on-surface">4. Responsibility for Betting</h2>
          <p>
            Betting involves significant financial risk. WealthFlow Pro does not guarantee profits or success. Any betting decisions made by a user are their sole responsibility. We strongly recommend betting only what you can afford to lose.
          </p>
        </section>

        <section className="space-y-4 border-l-2 border-primary/20 pl-6 py-2 bg-primary/5 rounded-r-xl">
          <p className="font-bold text-on-surface mb-2">Responsible Gambling</p>
          <p className="text-sm">
            If you have a gambling problem, please consult professional help. In the US, call 1-800-GAMBLER. In Nigeria, contact the National Lottery Regulatory Commission (NLRC).
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-on-surface">5. Prohibited Use</h2>
          <p>
            You may not use our data for automated betting bots, commercial redistribution, or scraping without express written permission.
          </p>
        </section>

        <section className="pt-10 border-t border-outline-variant/10 text-xs text-center">
            <Link href="/" className="text-primary hover:underline">Back to Home</Link>
        </section>
      </div>
    </main>
  )
}
