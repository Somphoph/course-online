'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { clearAuthToken, readAuthToken } from './auth-session';

const HIDDEN_PREFIXES = ['/login', '/register', '/admin'];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [token, setToken] = useState(null);

  useEffect(() => {
    setToken(readAuthToken());
  }, [pathname]);

  const hidden = HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (hidden) return null;

  function handleSignOut() {
    clearAuthToken();
    router.replace('/login');
  }

  const linkClass = 'font-bold tracking-tight text-on-surface/66 transition-all duration-200 hover:text-on-surface';
  const activeLinkClass = 'border-b-2 border-primary pb-1 font-bold tracking-tight text-primary';

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/70 bg-white/78 backdrop-blur-xl shadow-[0_10px_24px_rgba(25,28,34,0.05)]">
      <div className="mx-auto flex h-20 w-full max-w-screen-2xl items-center justify-between px-5 md:px-8">
        <Link href="/" className="font-headline text-2xl font-extrabold tracking-tighter text-on-surface no-underline">
          Course Online
        </Link>

        <div className="hidden items-center space-x-8 font-headline md:flex">
          <Link href="/courses" className={pathname.startsWith('/courses') ? activeLinkClass : linkClass}>
            Browse
          </Link>
          <Link
            href={token ? '/dashboard' : '/login'}
            className={pathname === '/dashboard' ? activeLinkClass : linkClass}
          >
            My Courses
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {token ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="font-bold text-on-surface/66 transition-all duration-200 hover:text-on-surface"
            >
              Sign out
            </button>
          ) : (
            <>
              <Link href="/login" className="font-bold text-on-surface/66 transition-all duration-200 hover:text-on-surface">
                Log In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg text-white font-bold shadow-lg hover:shadow-xl scale-95 active:scale-90 transition-transform no-underline"
                style={{ background: 'linear-gradient(135deg,#0052ae 0%,#006adc 100%)' }}
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
