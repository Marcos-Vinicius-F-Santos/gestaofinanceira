import { Check, Pencil, Trash2 } from 'lucide-react';
import EmptyState from '../shared/EmptyState';
import StatusBadge from '../shared/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/formatters';

function TableActions({ item, onEdit, onDelete, onSettle, settleLabel }) {
  return (
    <div className="flex gap-2">
      {onSettle ? (
        <button type="button" className="table-action text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800" onClick={() => onSettle(item)} aria-label={settleLabel} title={settleLabel}>
          <Check className="h-4 w-4" />
        </button>
      ) : null}
      {onEdit ? (
        <button type="button" className="table-action" onClick={() => onEdit(item)} aria-label="Editar" title="Editar">
          <Pencil className="h-4 w-4" />
        </button>
      ) : null}
      {onDelete ? (
        <button type="button" className="table-action text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700" onClick={() => onDelete(item.id)} aria-label="Excluir" title="Excluir">
          <Trash2 className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

function MobileActions({ item, onEdit, onDelete, onSettle, settleLabel }) {
  const secondaryActions = [
    onEdit
      ? (
        <button key="edit" type="button" className="btn-secondary min-h-11 w-full" onClick={() => onEdit(item)}>
          <Pencil className="h-4 w-4" />
          Editar
        </button>
        )
      : null,
    onDelete
      ? (
        <button key="delete" type="button" className="btn-danger min-h-11 w-full" onClick={() => onDelete(item.id)}>
          <Trash2 className="h-4 w-4" />
          Excluir
        </button>
        )
      : null,
  ].filter(Boolean);

  return (
    <div className="grid gap-2 pt-1">
      {onSettle ? (
        <button type="button" className="btn-secondary min-h-11 w-full border-emerald-200 bg-emerald-50 text-emerald-800" onClick={() => onSettle(item)}>
          <Check className="h-4 w-4" />
          {settleLabel}
        </button>
      ) : null}
      {secondaryActions.length ? (
        <div className={`grid gap-2 ${secondaryActions.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {secondaryActions}
        </div>
      ) : null}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-700">{value}</p>
    </div>
  );
}

export default function LancamentosTable({ items, onEdit, onDelete, onSettle, settleLabel = 'Quitar' }) {
  if (!items.length) {
    return <EmptyState description="Crie um lancamento ou ajuste os filtros." />;
  }

  return (
    <>
      <div className="space-y-3 lg:hidden">
        {items.map((item) => (
          <article key={item.id} className="panel p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="break-words text-base font-bold text-slate-900">{item.descricao}</h3>
                <p className="mt-1 text-sm text-slate-500">{item.clienteFornecedor}</p>
              </div>
              <StatusBadge value={item.tipo} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Detail label="Valor" value={formatCurrency(item.valor)} />
              <Detail label="Data" value={formatDate(item.data)} />
              <Detail label="Categoria" value={item.categoria} />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Status</p>
                <div className="mt-1">
                  <StatusBadge value={item.status} />
                </div>
              </div>
            </div>

            {onEdit || onDelete || onSettle ? (
              <div className="mt-4 border-t border-slate-100 pt-3">
                <MobileActions item={item} onEdit={onEdit} onDelete={onDelete} onSettle={onSettle} settleLabel={settleLabel} />
              </div>
            ) : null}
          </article>
        ))}
      </div>

      <div className="panel hidden overflow-hidden lg:block">
        <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {['Descricao', 'Tipo', 'Valor', 'Data', 'Pessoa', 'Categoria', 'Status', 'Acoes'].map((label) => (
                <th key={label} className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {items.map((item, index) => (
              <tr key={item.id} className={`${index % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'} transition hover:bg-blue-50/60`}>
                <td className="whitespace-nowrap px-4 py-3.5 text-sm font-bold text-slate-800">{item.descricao}</td>
                <td className="px-4 py-3.5 text-sm"><StatusBadge value={item.tipo} /></td>
                <td className="whitespace-nowrap px-4 py-3.5 text-sm font-bold text-slate-800">{formatCurrency(item.valor)}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">{formatDate(item.data)}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">{item.clienteFornecedor}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">{item.categoria}</td>
                <td className="px-4 py-3.5 text-sm"><StatusBadge value={item.status} /></td>
                <td className="whitespace-nowrap px-4 py-3">
                  <TableActions item={item} onEdit={onEdit} onDelete={onDelete} onSettle={onSettle} settleLabel={settleLabel} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </>
  );
}
