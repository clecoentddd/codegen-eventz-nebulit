import type { HTMLAttributes } from 'react';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'muted';
};

const variantClasses = {
  default: 'border-slate-200 bg-white text-slate-600',
  muted: 'border-slate-200 bg-white text-slate-500 uppercase tracking-[0.3em]',
};

export default function Badge({
  variant = 'default',
  className = '',
  ...props
}: BadgeProps) {
  return (
    <span
      {...props}
      className={
        `rounded-full border px-3 py-1 text-xs font-semibold ${variantClasses[variant]} ${className}`.trim()
      }
    />
  );
}
