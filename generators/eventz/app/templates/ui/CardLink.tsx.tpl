import Link from 'next/link';
import type { ReactNode } from 'react';

type CardLinkProps = {
  href: string;
  children: ReactNode;
  suffix?: string;
  className?: string;
};

export default function CardLink({
  href,
  children,
  suffix = 'Open',
  className = '',
}: CardLinkProps) {
  return (
    <Link
      href={href}
      className={
        `group flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 ${className}`.trim()
      }
    >
      <span>{children}</span>
      <span className="text-xs text-slate-400 transition group-hover:text-slate-500">
        {suffix}
      </span>
    </Link>
  );
}
