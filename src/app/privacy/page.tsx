import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <main className="pt-32 pb-32 px-6 max-w-3xl mx-auto space-y-12">
      <div className="space-y-4">
        <h1 className="text-4xl font-black text-on-surface tracking-tight">Privacy Policy</h1>
        <p className="text-on-surface-variant text-sm uppercase tracking-widest font-bold">Effective Date: March 26, 2026</p>
      </div>

      <div className="space-y-10 text-on-surface-variant leading-relaxed">
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-on-surface">1. Information We Collect</h2>
          <p>
            WealthFlow Pro collects minimal information required to provide our service, including:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Email address for authentication via **Supabase Auth**.</li>
            <li>Basic system data (browser type, IP address) for security and anti-fraud monitoring.</li>
            <li>**Note on Payment Data**: We do not store or process your credit card information. This is handled securely by **Paddle**, our Merchant of Record.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-on-surface">2. How We Use Data</h2>
          <p>
            We use your information to manage your subscription, provide authenticated access to premium betting intelligence, and prevent unauthorized account sharing.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-on-surface">3. Data Sharing</h2>
          <p>
            We share your email and user identification with **Paddle** to facilitate payment processing and subscription management. We do not sell your personal data to advertisers.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-on-surface">4. Security</h2>
          <p>
            We utilize **Supabase** (PostgreSQL/Supabase Auth) with row-level security (RLS) to ensure your betting and financial record data is only accessible via your authenticated account.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-on-surface">5. Cookies</h2>
          <p>
            We use essential cookies to maintain your session and security context. These are technical and do not track you across other websites.
          </p>
        </section>

        <section className="pt-10 border-t border-outline-variant/10 text-xs text-center">
            <div className="flex justify-center gap-6">
                <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
                <Link href="/" className="text-primary hover:underline">Back to Home</Link>
            </div>
        </section>
      </div>
    </main>
  )
}
