import FormField from '../shared/FormField';

export default function FiltersBar({ filters, onChange }) {
  const update = (field, value) => onChange({ ...filters, [field]: value });

  return (
    <div className="panel p-3 sm:p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink">Filtros</p>
          <p className="text-xs text-slate-500">Refine os registros exibidos na tabela.</p>
        </div>
        <button type="button" className="btn-secondary min-h-11 w-full px-3 text-sm sm:w-auto sm:text-xs" onClick={() => onChange({ startDate: '', endDate: '', tipo: '', status: '' })}>
          Limpar
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FormField id="filter-start" label="Data inicial">
          <input id="filter-start" type="date" value={filters.startDate} onChange={(event) => update('startDate', event.target.value)} />
        </FormField>
        <FormField id="filter-end" label="Data final">
          <input id="filter-end" type="date" value={filters.endDate} onChange={(event) => update('endDate', event.target.value)} />
        </FormField>
        <FormField id="filter-type" label="Tipo">
          <select id="filter-type" value={filters.tipo} onChange={(event) => update('tipo', event.target.value)}>
            <option value="">Todos</option>
            <option value="receita">Receita</option>
            <option value="despesa">Despesa</option>
          </select>
        </FormField>
        <FormField id="filter-status" label="Status">
          <select id="filter-status" value={filters.status} onChange={(event) => update('status', event.target.value)}>
            <option value="">Todos</option>
            <option value="pendente">Pendente</option>
            <option value="pago">Pago</option>
            <option value="aberto">Aberto</option>
            <option value="vencido">Vencido</option>
            <option value="recebido">Recebido</option>
          </select>
        </FormField>
      </div>
    </div>
  );
}
