import Link from 'next/link';
import type { ReactNode } from 'react';

type NavLinkPillProps = {
  href: string;
  children: ReactNode;
  className?: string;
};

export default function NavLinkPill({
  href,
  children,
  className = '',
}: NavLinkPillProps) {
  return (
    <Link
      href={href}
      className={
        `rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 ${className}`.trim()
      }
    >
      {children}
    </Link>
  );
}
