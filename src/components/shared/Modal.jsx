import { X } from 'lucide-react';

export default function Modal({ title, description, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full overflow-hidden rounded-t-lg border border-slate-200 bg-white shadow-xl sm:max-w-3xl sm:rounded-lg">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div>
            <h2 className="text-base font-bold text-ink">{title}</h2>
            {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
          </div>
          <button type="button" className="table-action shrink-0" onClick={onClose} aria-label="Fechar modal">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[calc(92vh-4.5rem)] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
