'use client';

import { usePathname } from 'next/navigation';

const NO_NAVBAR_PREFIXES = ['/login', '/register', '/admin'];

export default function PageWrapper({ children }) {
  const pathname = usePathname();
  const hasNavbar = !NO_NAVBAR_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  return <div className={hasNavbar ? 'pt-20' : ''}>{children}</div>;
}
