import type { ReactNode } from 'react';

import Badge from './Badge';
import Card from './Card';

type ReadmodelListProps = {
  title: string;
  description?: string;
  items?: unknown;
  loading?: boolean;
  error?: string;
  itemLabel?: string;
  emptyMessage?: string;
  footer?: ReactNode;
};

function formatLabel(label: string) {
  return label
    .replace(/_/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^\w/, (match) => match.toUpperCase());
}

function formatValue(value: unknown) {
  if (value === null || value === undefined) return '—';
  if (Array.isArray(value)) {
    if (value.length === 0) return '—';
    // Check if array contains objects
    if (typeof value[0] === 'object' && value[0] !== null) {
      return JSON.stringify(value, null, 2);
    }
    return value.join(', ');
  }
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

export default function ReadmodelList({
  title,
  description,
  items,
  loading,
  error,
  itemLabel = 'Entree',
  emptyMessage = 'Aucune entree disponible pour le moment.',
  footer,
}: ReadmodelListProps) {
  const list = Array.isArray(items) ? (items as Record<string, unknown>[]) : [];

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="h-4 w-40 rounded bg-slate-200" />
        <div className="mt-4 space-y-2">
          <div className="h-3 w-full rounded bg-slate-100" />
          <div className="h-3 w-5/6 rounded bg-slate-100" />
          <div className="h-3 w-2/3 rounded bg-slate-100" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-rose-200 bg-rose-50/80 text-rose-700">
        <p className="text-sm font-medium">Erreur</p>
        <p className="text-sm">{error}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Readmodel
          </p>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          {description ? <p className="text-sm text-slate-600">{description}</p> : null}
        </div>
        <Badge>
          {list.length} {list.length === 1 ? 'entree' : 'entrees'}
        </Badge>
      </div>

      {list.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-600">{emptyMessage}</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((item, index) => {
            const entries = Object.entries(item ?? {});
            const previewEntries = entries.slice(0, 6);
            const key =
              (item as { id?: string | number; uuid?: string | number })?.id ??
              (item as { uuid?: string | number })?.uuid ??
              index;

            return (
              <Card key={key} className="relative overflow-hidden">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                    {itemLabel}
                  </p>
                  <Badge className="bg-slate-100 text-slate-600">#{index + 1}</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  {previewEntries.map(([entryKey, entryValue]) => (
                    <div
                      key={entryKey}
                      className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2 last:border-b-0 last:pb-0"
                    >
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        {formatLabel(entryKey)}
                      </span>
                      <span className="text-right text-slate-700">
                        {formatValue(entryValue)}
                      </span>
                    </div>
                  ))}
                </div>
                {entries.length > previewEntries.length ? (
                  <p className="mt-3 text-xs text-slate-400">
                    +{entries.length - previewEntries.length} champs supplementaires
                  </p>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}

      {footer ? <div>{footer}</div> : null}
    </div>
  );
}
