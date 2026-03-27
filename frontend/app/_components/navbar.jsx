'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { clearAuthToken, readAuthToken } from './auth-session';
import styles from './navbar.module.css';

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

  return (
    <header className={styles.navbar}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true" />
          <span className={styles.brandName}>Course Online</span>
        </Link>

        <nav className={styles.nav}>
          <Link href="/" className={styles.navLink}>
            Browse
          </Link>
          <Link
            href={token ? '/dashboard' : '/login'}
            className={styles.navLink}
          >
            My Courses
          </Link>
          {token ? (
            <button
              type="button"
              className={styles.signOutBtn}
              onClick={handleSignOut}
            >
              Sign out
            </button>
          ) : (
            <Link href="/login" className={styles.loginBtn}>
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
