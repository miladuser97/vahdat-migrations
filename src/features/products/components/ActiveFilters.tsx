export interface ActiveFilter {
  key: string;
  label: string;
}

export interface ActiveFiltersProps {
  filters: ActiveFilter[];
  onRemove?: (key: string) => void;
  onClearAll?: () => void;
}

/**
 * ActiveFilters
 * Shows currently-applied filters as removable chips. Renders nothing
 * when the list is empty — always true right now, since no real
 * filtering exists. Prepared architecture for the day real filter
 * state exists, without needing another API change then.
 *
 * `onRemove` and `onClearAll` are just forwarded to native buttons'
 * onClick (not internal state), so this stays a Server Component —
 * same convention already used by Input/Select/Button accepting event
 * handler props. Phase 17: `onClearAll` only renders once there is
 * more than one filter to clear (clearing a single filter is already
 * what its own chip's remove button does).
 */
export function ActiveFilters({ filters, onRemove, onClearAll }: ActiveFiltersProps) {
  if (filters.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-xs">
      <div role="list" aria-label="فیلترهای فعال" className="flex flex-wrap gap-xs">
        {filters.map((filter) => (
          <span
            key={filter.key}
            role="listitem"
            className="inline-flex items-center gap-xs rounded-full bg-muted px-sm py-xs text-body-sm text-text-primary"
          >
            {filter.label}
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(filter.key)}
                aria-label={`حذف فیلتر ${filter.label}`}
                className="text-text-secondary hover:text-text-primary"
              >
                ×
              </button>
            )}
          </span>
        ))}
      </div>

      {onClearAll && filters.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-body-sm text-text-secondary underline-offset-2 hover:text-text-primary hover:underline"
        >
          پاک کردن همه
        </button>
      )}
    </div>
  );
}
