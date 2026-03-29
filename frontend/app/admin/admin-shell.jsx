'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearAuthToken } from '../_components/auth-session';
import AdminAccessGate from './admin-access-gate';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: 'dashboard' },
  { href: '/admin/courses', label: 'Courses', icon: 'menu_book' },
  { href: '/admin/students', label: 'Students', icon: 'group' },
];

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  function handleSignOut() {
    clearAuthToken();
    router.replace('/admin/login');
  }

  return (
    <AdminAccessGate>
      <div className="page-shell flex">
        <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-outline-variant/30 bg-white/94 shadow-[0_12px_30px_rgba(25,28,34,0.06)] backdrop-blur">
          <div className="border-b border-outline-variant/30 px-6 py-6">
            <h2 className="font-headline font-bold text-lg text-primary leading-tight">
              Course Online
            </h2>
            <span className="inline-block mt-1 px-2 py-0.5 bg-surface-container text-on-surface-variant text-[10px] font-bold uppercase tracking-widest rounded">
              Admin
            </span>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Admin sections">
            {NAV_ITEMS.map(({ href, label, icon }) => {
              const isActive =
                pathname === href ||
                (href !== '/admin' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`admin-sidebar-link ${isActive ? 'admin-sidebar-link-active' : 'admin-sidebar-link-idle'}`}
                >
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                  >
                    {icon}
                  </span>
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="space-y-1 border-t border-outline-variant/30 px-3 pb-6 pt-4">
            <a className="admin-sidebar-link admin-sidebar-link-idle">
              <span className="material-symbols-outlined text-[20px]">settings</span>
              Settings
            </a>
            <button type="button" onClick={handleSignOut} className="admin-sidebar-link admin-sidebar-link-idle w-full">
              <span className="material-symbols-outlined text-[20px]">logout</span>
              Logout
            </button>
          </div>
        </aside>

        <main className="ml-64 min-h-screen flex-1 overflow-auto bg-background p-8">
          {children}
        </main>
      </div>
    </AdminAccessGate>
  );
}
