import Link from 'next/link'

export default function RefundPage() {
  return (
    <main className="pt-32 pb-32 px-6 max-w-3xl mx-auto space-y-12">
      <div className="space-y-4">
        <h1 className="text-4xl font-black text-on-surface tracking-tight">Refund Policy</h1>
        <p className="text-on-surface-variant text-sm uppercase tracking-widest font-bold">Policy version: March 26, 2026</p>
      </div>

      <div className="space-y-10 text-on-surface-variant leading-relaxed text-sm">
        <p className="text-lg">
          We want you to be satisfied. Our refund policy is straightforward.
        </p>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-on-surface underline decoration-primary/20 decoration-4 underline-offset-8">1. Standard Cancellations</h2>
          <p>
            You can cancel your WealthFlow Pro subscription at any time. Your access will remain active until the end of your current billing period. No further charges will occur.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-on-surface underline decoration-primary/20 decoration-4 underline-offset-8">2. 48-Hour Refund Policy</h2>
          <p>
            WE OFFER A **FULL 48-HOUR MONEY BACK GUARANTEE** for new subscriptions. If you find the tool is not for you, simply reach out to us at **support@wealth-flow.app** (or via the Paddle portal) within 48 hours of your first purchase.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-on-surface underline decoration-primary/20 decoration-4 underline-offset-8">3. Recurring Payments</h2>
          <p>
            Refunds are not typically provided for recurring monthly or annual payments after the 48-hour window. It is the user&apos;s responsibility to cancel their subscription before a renewal date.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-on-surface underline decoration-primary/20 decoration-4 underline-offset-8">4. Betting Losses</h2>
          <p>
            **IMPORTANT: NO REFUNDS WILL BE ISSUED ON THE BASIS OF BETTING LOSSES.** WealthFlow Pro provides statistical data and predictions, not guaranteed outcomes. Any financial loss incurred while betting is not an eligible reason for a refund.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-on-surface underline decoration-primary/20 decoration-4 underline-offset-8">5. Fraud & Chargebacks</h2>
          <p>
            If you have a problem with your payment, please reach out to us directly or through **Paddle**. Unauthorized chargebacks with your bank will result in an immediate and permanent ban of your WealthFlow Pro account.
          </p>
        </section>

        <section className="pt-10 border-t border-outline-variant/10 text-xs text-center">
            <Link href="/" className="text-primary hover:underline">Return to Home</Link>
        </section>
      </div>
    </main>
  )
}
