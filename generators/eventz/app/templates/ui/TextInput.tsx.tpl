import type { InputHTMLAttributes } from 'react';

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export default function TextInput({ label, className = '', ...props }: TextInputProps) {
  return (
    <div className="grid gap-1">
      <label
        htmlFor={props.id}
        className="text-xs font-semibold uppercase tracking-widest text-slate-500"
      >
        {label}
      </label>
      <input
        {...props}
        className={
          `rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-200/70 ${className}`.trim()
        }
      />
    </div>
  );
}
