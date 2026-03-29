'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const HIDDEN_PREFIXES = ['/login', '/register', '/admin'];

export default function Footer() {
  const pathname = usePathname();
  const hidden = HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (hidden) return null;

  return (
    <footer className="mt-24 border-t border-slate-200 bg-slate-50 px-8 py-12">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="mb-4 font-headline text-xl font-black text-slate-900">Course Online</div>
          <p className="mb-6 text-sm leading-relaxed text-slate-500">
            Self-paced courses covering Microsoft Excel, MS Access, Power Automate, and AppSheet.
          </p>
          <div className="flex gap-4">
            <span className="material-symbols-outlined cursor-pointer text-slate-400 transition-colors hover:text-primary">language</span>
            <span className="material-symbols-outlined cursor-pointer text-slate-400 transition-colors hover:text-primary">alternate_email</span>
          </div>
        </div>

        <div className="flex flex-col space-y-3 text-sm text-slate-500">
          <h6 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-900">Platform</h6>
          <Link className="no-underline text-slate-500 transition-colors hover:text-slate-900" href="/courses">Course Catalog</Link>
          <Link className="no-underline text-slate-500 transition-colors hover:text-slate-900" href="/dashboard">My Courses</Link>
        </div>

        <div className="flex flex-col space-y-3 text-sm text-slate-500">
          <h6 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-900">Account</h6>
          <Link className="no-underline text-slate-500 transition-colors hover:text-slate-900" href="/register">Register</Link>
          <Link className="no-underline text-slate-500 transition-colors hover:text-slate-900" href="/login">Log In</Link>
        </div>

        <div className="flex flex-col space-y-3 text-sm text-slate-500">
          <h6 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-900">Support</h6>
          <Link className="no-underline text-slate-500 transition-colors hover:text-slate-900" href="/forgot-password">Forgot Password</Link>
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 md:flex-row">
        <p className="m-0 text-sm text-slate-500">© {new Date().getFullYear()} Course Online. All rights reserved.</p>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-secondary" />
          <span className="text-xs font-bold uppercase tracking-tighter text-slate-400">System Operational</span>
        </div>
      </div>
    </footer>
  );
}
