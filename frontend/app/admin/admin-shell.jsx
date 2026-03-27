'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AdminAccessGate from './admin-access-gate';
import styles from './page.module.css';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/enrollments', label: 'Enrollments' },
  { href: '/admin/courses', label: 'Courses' },
  { href: '/admin/students', label: 'Students' },
];

export default function AdminShell({ children }) {
  const pathname = usePathname();

  return (
    <AdminAccessGate>
      <main className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.brand}>
            <span className={styles.brandMark} />
            <div>
              <p className={styles.brandKicker}>Course Online</p>
              <p className={styles.brandTitle}>Admin</p>
            </div>
          </div>

          <nav className={styles.nav} aria-label="Admin sections">
            {NAV_ITEMS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`${styles.navItem} ${pathname === href || (href !== '/admin' && pathname.startsWith(href)) ? styles.navItemActive : ''}`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </aside>

        <section className={styles.workspace}>{children}</section>
      </main>
    </AdminAccessGate>
  );
}
