import { login } from './actions'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPage({ searchParams }: { searchParams?: { error?: string } }) {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-4 bg-surface-dim overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl overflow-hidden mb-5 border border-outline-variant/20 relative shadow-2xl shadow-primary/20 ring-1 ring-primary/10">
            <Image src="/logo.png" alt="WealthFlow Logo" fill className="object-cover" />
          </div>
          <h2 className="text-3xl font-black text-on-surface tracking-tight leading-none mb-2">Welcome Back</h2>
          <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Sign in to your dashboard</p>
        </div>
        
        <div className="bg-surface-container-low p-8 rounded-[2rem] border border-outline-variant/10 ring-1 ring-outline-variant/5 shadow-2xl shadow-black/5 hover:ring-primary/20 transition-all duration-500 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <form className="space-y-5" action={login}>
            {searchParams?.error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-xs font-bold text-center">
                {searchParams.error}
              </div>
            )}
            
            <div className="space-y-4">
              <div className="space-y-1.5 flex flex-col">
                <label htmlFor="email" className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-2">Email address</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[18px] text-zinc-400 pointer-events-none">mail</span>
                  <input 
                    id="email" name="email" type="email" required 
                    className="block w-full rounded-2xl bg-surface-container-high border border-outline-variant/10 text-on-surface focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-sm pl-11 pr-4 py-3.5 outline-none transition-all placeholder:text-zinc-600 font-medium"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <div className="space-y-1.5 flex flex-col">
                <label htmlFor="password" className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-2">Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[18px] text-zinc-400 pointer-events-none">lock</span>
                  <input 
                    id="password" name="password" type="password" required 
                    className="block w-full rounded-2xl bg-surface-container-high border border-outline-variant/10 text-on-surface focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-sm pl-11 pr-4 py-3.5 outline-none transition-all placeholder:text-zinc-600 font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="w-full flex justify-center items-center gap-2 py-4 px-4 rounded-2xl font-black text-[11px] text-on-primary bg-primary hover:bg-primary/90 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 uppercase tracking-[0.2em] mt-8 group relative overflow-hidden">
              <span className="relative z-10 flex items-center gap-2">Sign In <span className="material-symbols-outlined text-[14px]">arrow_forward</span></span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] font-bold text-zinc-500 mt-8 uppercase tracking-widest">
          New to the platform? <Link href="/signup" className="text-primary hover:underline hover:text-primary/80 transition-colors">Create account</Link>
        </p>
      </div>
    </div>
  )
}
