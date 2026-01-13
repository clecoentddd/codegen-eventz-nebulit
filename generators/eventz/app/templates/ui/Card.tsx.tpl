import type { HTMLAttributes } from 'react';

type CardProps = HTMLAttributes<HTMLDivElement>;

export default function Card({ className = '', ...props }: CardProps) {
  return (
    <div
      {...props}
      className={
        `rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur ${className}`.trim()
      }
    />
  );
}
