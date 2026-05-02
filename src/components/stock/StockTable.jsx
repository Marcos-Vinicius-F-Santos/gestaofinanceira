import EmptyState from '../shared/EmptyState';
import { formatDate } from '../../utils/formatters';
import StatusBadge from '../shared/StatusBadge';

function movementDateKey(item) {
  return String(item.data || item.createdAt || '');
}

function getLastProductMovement(productId, movements) {
  return movements
    .filter((movement) => movement.produtoId === productId)
    .sort((a, b) => movementDateKey(b).localeCompare(movementDateKey(a)))[0] || null;
}

function LastMovement({ movement }) {
  if (!movement) {
    return <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-500">Nenhuma movimentacao registrada para este produto.</p>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <div className="hidden bg-slate-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-500 sm:grid sm:grid-cols-[110px_90px_100px_1fr] sm:gap-3">
        <span>Tipo</span>
        <span>Qtd.</span>
        <span>Data</span>
        <span>Observacao</span>
      </div>
      <div className="grid gap-2 px-3 py-3 text-sm sm:grid-cols-[110px_90px_100px_1fr] sm:gap-3">
        <div><StatusBadge value={movement.tipo} /></div>
        <p className="font-bold text-slate-800">{movement.quantidade}</p>
        <p className="text-slate-600">{formatDate(movement.data)}</p>
        <p className="break-words text-slate-600">{movement.observacao || '-'}</p>
      </div>
    </div>
  );
}

export default function StockTable({ items, movements = [] }) {
  if (!items.length) {
    return <EmptyState description="Registre entradas e saidas para acompanhar o estoque." />;
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const lastMovement = getLastProductMovement(item.id, movements);

        return (
          <article key={item.id} className="panel overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="mb-2 inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs font-bold text-slate-700">
                  {item.codigo || '-'}
                </div>
                <h3 className="break-words text-base font-bold text-slate-900">{item.nome || item.produto}</h3>
                <p className="mt-1 text-sm text-slate-500">Atualizado em {formatDate(item.updatedAt)}</p>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-left sm:text-center">
                <p className="text-[11px] font-bold uppercase tracking-wide text-blue-600">Quantidade</p>
                <p className="text-2xl font-bold text-blue-800">{item.quantidadeAtual}</p>
              </div>
            </div>
            <div className="p-4">
              <div className="mb-3">
                <p className="text-sm font-bold text-ink">Ultima movimentacao</p>
                <p className="text-xs text-slate-500">Historico completo em Relatorios.</p>
              </div>
              <LastMovement movement={lastMovement} />
            </div>
          </article>
        );
      })}
    </div>
  );
}
