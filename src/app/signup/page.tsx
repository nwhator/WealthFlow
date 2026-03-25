import { signup } from '@/app/login/actions'
import Link from 'next/link'
import Image from 'next/image'

export default function SignupPage({
  searchParams,
}: {
  searchParams?: { error?: string }
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
      <div className="w-full max-w-md space-y-8 bg-surface-container p-8 rounded-2xl border border-outline-variant/10">
        <div className="text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-xl overflow-hidden mb-4 border border-outline-variant/20 relative shadow-xl shadow-primary/10">
            <Image src="/logo.png" alt="WealthFlow Logo" fill className="object-cover" />
          </div>
          <h2 className="text-3xl font-black text-emerald-500 tracking-tight">WealthFlow</h2>
          <p className="mt-2 text-sm text-on-surface-variant">Create a new account</p>
        </div>
        
        <form className="mt-8 space-y-6" action={signup}>
          {searchParams?.error && (
            <div className="bg-error-container text-on-error p-3 rounded-md text-sm">
              {searchParams.error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-on-surface-variant">Email address</label>
              <input 
                id="email" 
                name="email" 
                type="email" 
                required 
                className="mt-1 block w-full rounded-md bg-surface-container-high border-outline-variant/30 text-on-surface focus:border-primary focus:ring-primary sm:text-sm px-4 py-3 outline-none border transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-on-surface-variant">Password</label>
              <input 
                id="password" 
                name="password" 
                type="password" 
                required 
                className="mt-1 block w-full rounded-md bg-surface-container-high border-outline-variant/30 text-on-surface focus:border-primary focus:ring-primary sm:text-sm px-4 py-3 outline-none border transition-colors"
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          </div>

          <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-on-primary bg-primary hover:bg-primary-fixed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors mt-6">
            Create account
          </button>
        </form>

        <p className="text-center text-sm text-on-surface-variant mt-4">
          Already have an account? <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
