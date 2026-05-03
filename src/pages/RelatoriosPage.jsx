import { Download } from 'lucide-react';
import { useMemo, useState } from 'react';
import Alert from '../components/shared/Alert';
import EmptyState from '../components/shared/EmptyState';
import FormField from '../components/shared/FormField';
import LoadingState from '../components/shared/LoadingState';
import PageHeader from '../components/shared/PageHeader';
import StatusBadge from '../components/shared/StatusBadge';
import { useDataScope } from '../hooks/useDataScope';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { byField } from '../services/firestoreService';
import { normalizeProduto } from '../services/produtoService';
import { exportToCSV } from '../utils/csv';
import { formatDate } from '../utils/formatters';

const movementFiltersInitial = {
  codigo: '',
  tipo: '',
  startDate: '',
  endDate: '',
};

function productStatus(product) {
  if (product.estoqueMinimo === '' || product.estoqueMinimo === undefined || product.estoqueMinimo === null) {
    return 'normal';
  }

  return Number(product.quantidadeAtual || 0) <= Number(product.estoqueMinimo) ? 'baixo' : 'normal';
}

function exportProducts(products) {
  exportToCSV(
    'relatorio-produtos.csv',
    products.map((product) => ({
      codigo: product.codigo,
      nome: product.nome,
      unidadeMedida: product.unidadeMedida || '',
      quantidadeAtual: product.quantidadeAtual,
      estoqueMinimo: product.estoqueMinimo === '' ? '' : product.estoqueMinimo,
      status: productStatus(product),
      updatedAt: formatDate(product.updatedAt),
    })),
    ['codigo', 'nome', 'unidadeMedida', 'quantidadeAtual', 'estoqueMinimo', 'status', 'updatedAt'],
  );
}

function exportMovements(movements) {
  exportToCSV(
    'relatorio-movimentacoes.csv',
    movements.map((movement) => ({
      data: movement.data || '',
      produtoCodigo: movement.produtoCodigo || '',
      produtoNome: movement.produtoNome || '',
      tipo: movement.tipo || '',
      quantidade: movement.quantidade || 0,
      saldoAnterior: movement.saldoAnterior ?? '',
      saldoPosterior: movement.saldoPosterior ?? '',
      observacao: movement.observacao || '',
    })),
    ['data', 'produtoCodigo', 'produtoNome', 'tipo', 'quantidade', 'saldoAnterior', 'saldoPosterior', 'observacao'],
  );
}

function ProductsReport({ products }) {
  if (!products.length) {
    return <EmptyState title="Nenhum produto cadastrado" />;
  }

  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {['Codigo', 'Nome', 'Unidade', 'Quantidade atual', 'Estoque minimo', 'Status', 'Ultima atualizacao'].map((label) => (
                <th key={label} className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {products.map((product, index) => (
              <tr key={product.id} className={`${index % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'} transition hover:bg-blue-50/60`}>
                <td className="whitespace-nowrap px-4 py-3.5 font-mono text-sm font-bold text-slate-800">{product.codigo}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-sm font-bold text-slate-800">{product.nome}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">{product.unidadeMedida || '-'}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-sm font-bold text-slate-800">{product.quantidadeAtual}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">{product.estoqueMinimo === '' ? '-' : product.estoqueMinimo}</td>
                <td className="whitespace-nowrap px-4 py-3.5"><StatusBadge value={productStatus(product)} /></td>
                <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">{formatDate(product.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MovementsReport({ movements }) {
  if (!movements.length) {
    return <EmptyState title="Nenhuma movimentacao encontrada" description="Ajuste os filtros ou registre uma movimentacao." />;
  }

  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {['Data', 'Codigo', 'Produto', 'Tipo', 'Quantidade', 'Saldo anterior', 'Saldo posterior', 'Observacao'].map((label) => (
                <th key={label} className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {movements.map((movement, index) => (
              <tr key={movement.id} className={`${index % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'} transition hover:bg-blue-50/60`}>
                <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">{formatDate(movement.data)}</td>
                <td className="whitespace-nowrap px-4 py-3.5 font-mono text-sm font-bold text-slate-800">{movement.produtoCodigo}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-sm font-bold text-slate-800">{movement.produtoNome || '-'}</td>
                <td className="whitespace-nowrap px-4 py-3.5"><StatusBadge value={movement.tipo} /></td>
                <td className="whitespace-nowrap px-4 py-3.5 text-sm font-bold text-slate-800">{movement.quantidade}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">{movement.saldoAnterior ?? '-'}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">{movement.saldoPosterior ?? '-'}</td>
                <td className="min-w-64 px-4 py-3.5 text-sm text-slate-600">{movement.observacao || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function RelatoriosPage() {
  const scope = useDataScope();
  const constraints = useMemo(
    () => (scope.effectiveUserId ? [byField('userId', '==', scope.effectiveUserId)] : []),
    [scope.effectiveUserId],
  );
  const { items: productItems, loading: loadingProducts, error: productsError } = useFirestoreCollection('produtos', constraints);
  const { items: movementItems, loading: loadingMovements, error: movementsError } = useFirestoreCollection('movimentacoes', constraints);
  const [activeTab, setActiveTab] = useState('produtos');
  const [filters, setFilters] = useState(movementFiltersInitial);
  const products = useMemo(
    () => productItems.map(normalizeProduto).sort((a, b) => a.codigo.localeCompare(b.codigo)),
    [productItems],
  );
  const movements = useMemo(
    () => [...movementItems].sort((a, b) => String(b.data || b.createdAt || '').localeCompare(String(a.data || a.createdAt || ''))),
    [movementItems],
  );
  const filteredMovements = useMemo(
    () => movements.filter((movement) => {
      const matchesCodigo = !filters.codigo || movement.produtoCodigo?.toLowerCase().includes(filters.codigo.toLowerCase());
      const matchesTipo = !filters.tipo || movement.tipo === filters.tipo;
      const matchesStart = !filters.startDate || movement.data >= filters.startDate;
      const matchesEnd = !filters.endDate || movement.data <= filters.endDate;

      return matchesCodigo && matchesTipo && matchesStart && matchesEnd;
    }),
    [movements, filters],
  );

  if (loadingProducts || loadingMovements) {
    return <LoadingState label="Carregando relatorios..." />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader title="Relatorios" description="Consulte produtos e historico completo de movimentacoes." />
      <Alert variant="error">{productsError || movementsError}</Alert>

      <div className="panel p-2">
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className={`btn ${activeTab === 'produtos' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'}`} onClick={() => setActiveTab('produtos')}>
            Produtos
          </button>
          <button type="button" className={`btn ${activeTab === 'movimentacoes' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'}`} onClick={() => setActiveTab('movimentacoes')}>
            Movimentacoes
          </button>
        </div>
      </div>

      {activeTab === 'produtos' ? (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-ink">Relatorio de Produtos</h2>
              <p className="text-sm text-slate-500">Status normal ou baixo conforme estoque minimo.</p>
            </div>
            <button type="button" className="btn-secondary w-full sm:w-auto" onClick={() => exportProducts(products)}>
              <Download className="h-4 w-4" />
              Exportar CSV
            </button>
          </div>
          <ProductsReport products={products} />
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-ink">Relatorio de Movimentacoes</h2>
              <p className="text-sm text-slate-500">Historico completo com saldos antes e depois.</p>
            </div>
            <button type="button" className="btn-secondary w-full sm:w-auto" onClick={() => exportMovements(filteredMovements)}>
              <Download className="h-4 w-4" />
              Exportar CSV
            </button>
          </div>

          <div className="panel grid gap-3 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-4">
            <FormField id="reportCodigo" label="Codigo">
              <input id="reportCodigo" value={filters.codigo} onChange={(event) => setFilters({ ...filters, codigo: event.target.value })} placeholder="Filtrar codigo" />
            </FormField>
            <FormField id="reportTipo" label="Tipo">
              <select id="reportTipo" value={filters.tipo} onChange={(event) => setFilters({ ...filters, tipo: event.target.value })}>
                <option value="">Todos</option>
                <option value="entrada">Entrada</option>
                <option value="saida">Saida</option>
              </select>
            </FormField>
            <FormField id="reportStart" label="Data inicial">
              <input id="reportStart" type="date" value={filters.startDate} onChange={(event) => setFilters({ ...filters, startDate: event.target.value })} />
            </FormField>
            <FormField id="reportEnd" label="Data final">
              <input id="reportEnd" type="date" value={filters.endDate} onChange={(event) => setFilters({ ...filters, endDate: event.target.value })} />
            </FormField>
          </div>

          <MovementsReport movements={filteredMovements} />
        </section>
      )}
    </div>
  );
}
