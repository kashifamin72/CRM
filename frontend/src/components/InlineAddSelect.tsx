import { useState, useRef, useEffect } from 'react';
import { Plus, Check, Loader2, ChevronDown, X } from 'lucide-react';
import clsx from 'clsx';

interface InlineAddSelectOption {
  id: number | string;
  name: string;
  color?: string;
  isActive?: boolean;
}

interface InlineAddSelectProps {
  label?: string;
  value: string | number;
  onChange: (value: string) => void;
  options: InlineAddSelectOption[];
  onAdd: (name: string) => Promise<InlineAddSelectOption | null>;
  placeholder?: string;
  required?: boolean;
  hideForNonAdmin?: boolean;
  hidden?: boolean;
  showColorDot?: boolean;
  emptyMessage?: string;
}

export default function InlineAddSelect({
  label,
  value,
  onChange,
  options,
  onAdd,
  placeholder = 'Select...',
  required,
  hidden,
  showColorDot,
  emptyMessage = 'No options',
}: InlineAddSelectProps) {
  const safeLabel = label ?? 'item';
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding && inputRef.current) inputRef.current.focus();
  }, [adding]);

  if (hidden) return null;

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await onAdd(trimmed);
      if (created) {
        onChange(String(created.id));
        setNewName('');
        setAdding(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to add');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {label && (
        <label className="block text-xs font-medium text-slate-700 mb-1">
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="flex gap-1.5">
        <div className="relative flex-1 min-w-0">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="input pr-8 appearance-none w-full"
            required={required}
          >
            <option value="">{placeholder}</option>
            {options.length === 0 && (
              <option value="" disabled>
                {emptyMessage}
              </option>
            )}
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}{o.isActive === false ? ' (inactive)' : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          {showColorDot && value && (
            (() => {
              const selected = options.find((o) => String(o.id) === String(value));
              if (selected?.color) {
                return (
                  <span
                    className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: selected.color }}
                    aria-hidden
                  />
                );
              }
              return null;
            })()
          )}
        </div>
        <button
          type="button"
          onClick={() => { setAdding(true); setError(null); }}
          className="btn-icon flex-shrink-0"
          title={`Add ${safeLabel.toLowerCase()}`}
          aria-label={`Add new ${safeLabel.toLowerCase()}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {adding && (
        <div className="mt-2 flex items-center gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg">
          <input
            ref={inputRef}
            type="text"
            value={newName}
            onChange={(e) => { setNewName(e.target.value); setError(null); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); handleAdd(); }
              if (e.key === 'Escape') { setAdding(false); setNewName(''); setError(null); }
            }}
            placeholder={`New ${safeLabel.toLowerCase()} name...`}
            className={clsx('input flex-1 text-sm py-1.5', error && 'border-rose-300')}
            disabled={submitting}
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={submitting || !newName.trim()}
            className="btn-primary py-1.5 px-2.5"
            aria-label="Confirm add"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => { setAdding(false); setNewName(''); setError(null); }}
            className="btn-icon"
            aria-label="Cancel add"
            disabled={submitting}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {error && !adding && (
        <p className="text-xs text-rose-600 mt-1">{error}</p>
      )}
    </div>
  );
}
