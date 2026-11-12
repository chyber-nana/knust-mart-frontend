import { Link } from "react-router-dom";
import type { ReactNode } from "react";

const LOGO_URL = "https://vkhgvaencdidocddyorp.supabase.co/storage/v1/object/public/knust-mart/logo.jpg";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page min-h-screen p-3 sm:p-6 lg:p-8">
      <div className="auth-layout mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-7xl grid-cols-1 gap-4 sm:min-h-[calc(100vh-3rem)] sm:gap-6 lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[1.05fr_.95fr] lg:gap-8">
        <aside className="auth-art relative hidden overflow-hidden rounded-[2rem] p-8 text-white sm:p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full border-[3rem] border-white/10" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rotate-12 rounded-[35%] border-[2rem] border-[#e9ba4f]/30" />
          <Link to="/" className="relative z-10 inline-flex w-fit items-center gap-3 rounded-full border border-white/20 bg-white/10 p-2 pr-5 backdrop-blur transition hover:bg-white/15">
            <img src={LOGO_URL} alt="" className="h-10 w-10 rounded-full bg-white object-contain p-1" />
            <span className="font-display text-lg font-bold tracking-tight">KNUST Mart</span>
          </Link>
          <div className="relative z-10 max-w-xl">
            <div className="mb-5 h-1.5 w-14 rounded-full bg-[#e9ba4f]" />
            <h1 className="font-display text-5xl font-bold leading-[.98] tracking-[-.05em] xl:text-7xl">Marketplace</h1>
            <p className="mt-5 max-w-sm text-base leading-7 text-white/80">Join the KNUST student marketplace.</p>
            <div className="mt-10 flex items-end gap-3" aria-hidden="true">
              <span className="auth-art-tile h-16 w-16 rotate-[-8deg] rounded-[1.2rem] bg-[#e9ba4f]" />
              <span className="auth-art-tile h-24 w-24 rotate-[7deg] rounded-[1.6rem] border-2 border-white/30 bg-white/15" />
              <span className="auth-art-tile h-12 w-12 rotate-[12deg] rounded-[1rem] bg-[#65bf88]" />
            </div>
          </div>
          <Link to="/" className="relative z-10 w-fit text-sm font-semibold text-white/75 underline decoration-white/35 underline-offset-4 transition hover:text-white">Continue browsing without signing in</Link>
        </aside>

        <section className="flex min-w-0 items-center justify-center px-1 py-12 sm:px-5 lg:px-7">
          <div className="w-full max-w-md">
            <Link to="/" className="auth-mobile-brand mb-7 inline-flex items-center gap-2 font-display text-lg font-bold tracking-tight text-brand lg:hidden">
              <img src={LOGO_URL} alt="" className="h-9 w-9 rounded-[28%] object-contain" />
              <span>KNUST <span className="text-ink">Mart</span></span>
            </Link>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
