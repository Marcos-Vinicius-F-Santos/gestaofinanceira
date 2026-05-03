import { Download } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Alert from '../components/shared/Alert';
import EmptyState from '../components/shared/EmptyState';
import FormField from '../components/shared/FormField';
import LoadingState from '../components/shared/LoadingState';
import PageHeader from '../components/shared/PageHeader';
import StatusBadge from '../components/shared/StatusBadge';
import { useDataScope } from '../hooks/useDataScope';
import { getMovimentacoes } from '../services/movimentacaoService';
import { getParcelas, getStatusContaPagar, getStatusContaReceber } from '../services/parcelaService';
import { exportToCSV } from '../utils/csv';
import { formatCurrency, formatDate } from '../utils/formatters';

const initialFilters = {
  produto: '',
  fornecedor: '',
  tipo: '',
  dataInicial: '',
  dataFinal: '',
  conta: '',
  subConta: '',
  status: '',
};

function getContaName(movement) {
  return movement.conta || movement.contaNome || '';
}

function getSubcontaName(movement) {
  return movement.subConta || movement.subcontaNome || '';
}

export default function HistoricoPage() {
  const scope = useDataScope();
  const [movements, setMovements] = useState([]);
  const [parcelas, setParcelas] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');

  const loadMovements = useCallback(async () => {
    if (!scope.effectiveUserId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setActionError('');

    try {
      const [loadedMovements, loadedParcelas] = await Promise.all([getMovimentacoes(scope), getParcelas(scope)]);
      setMovements(loadedMovements);
      setParcelas(loadedParcelas);
    } catch (err) {
      setActionError(err.message || 'Nao foi possivel carregar historico.');
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    loadMovements();
  }, [loadMovements]);

  const movementFinance = useMemo(() => {
    const grouped = new Map();
    parcelas.forEach((parcela) => {
      const group = grouped.get(parcela.movimentacaoId) || [];
      group.push(parcela);
      grouped.set(parcela.movimentacaoId, group);
    });

    return Object.fromEntries(movements.map((movement) => {
      const movementParcelas = (grouped.get(movement.id) || []).sort((a, b) => String(a.dataVencimento || '').localeCompare(String(b.dataVencimento || '')));

      if (!movementParcelas.length) {
        return [movement.id, { status: '-', vencimento: '' }];
      }

      if (movement.tipo === 'receita') {
        const statuses = movementParcelas.map(getStatusContaReceber);
        const status = statuses.every((item) => item === 'recebido') ? 'recebido' : statuses.includes('atrasado') ? 'atrasado' : 'aberto';
        return [movement.id, { status, vencimento: movementParcelas[0]?.dataVencimento || '' }];
      }

      const statuses = movementParcelas.map(getStatusContaPagar);
      const status = statuses.every((item) => item === 'pago') ? 'pago' : statuses.includes('vencido') ? 'vencido' : 'aberto';
      return [movement.id, { status, vencimento: movementParcelas[0]?.dataVencimento || '' }];
    }));
  }, [movements, parcelas]);

  const enrichedMovements = useMemo(
    () => movements.map((movement) => ({ ...movement, financeiro: movementFinance[movement.id] || { status: '-', vencimento: '' } })),
    [movementFinance, movements],
  );

  const filteredMovements = useMemo(
    () => enrichedMovements.filter((movement) => {
      const productText = `${movement.produtoCodigo || ''} ${movement.produtoNome || ''}`.toLowerCase();
      const supplierText = `${movement.fornecedorNome || ''}`.toLowerCase();
      const matchesProduto = !filters.produto || productText.includes(filters.produto.toLowerCase());
      const matchesFornecedor = !filters.fornecedor || supplierText.includes(filters.fornecedor.toLowerCase());
      const matchesTipo = !filters.tipo || movement.tipo === filters.tipo;
      const matchesStart = !filters.dataInicial || movement.dataReferencia >= filters.dataInicial;
      const matchesEnd = !filters.dataFinal || movement.dataReferencia <= filters.dataFinal;
      const matchesConta = !filters.conta || String(getContaName(movement)).toLowerCase().includes(filters.conta.toLowerCase());
      const matchesSubConta = !filters.subConta || String(getSubcontaName(movement)).toLowerCase().includes(filters.subConta.toLowerCase());
      const matchesStatus = !filters.status || movement.financeiro.status === filters.status;

      return matchesProduto && matchesFornecedor && matchesTipo && matchesStart && matchesEnd && matchesConta && matchesSubConta && matchesStatus;
    }),
    [enrichedMovements, filters],
  );

  const updateFilter = (field, value) => setFilters((prev) => ({ ...prev, [field]: value }));

  const exportHistory = () => {
    exportToCSV(
      'historico-movimentacoes.csv',
      filteredMovements.map((movement) => ({
        dataReferencia: movement.dataReferencia,
        produtoCodigo: movement.produtoCodigo,
        produtoNome: movement.produtoNome,
        fornecedorNome: movement.fornecedorNome,
        tipo: movement.tipo,
        quantidade: movement.quantidade,
        valorTotal: movement.valorTotal,
        valorUnitario: movement.valorUnitario,
        conta: getContaName(movement),
        subConta: getSubcontaName(movement),
        statusFinanceiro: movement.financeiro.status,
        vencimento: movement.financeiro.vencimento,
        observacao: movement.observacao,
        parcelas: movement.parcelas || 0,
      })),
      ['dataReferencia', 'produtoCodigo', 'produtoNome', 'fornecedorNome', 'tipo', 'quantidade', 'valorTotal', 'valorUnitario', 'conta', 'subConta', 'statusFinanceiro', 'vencimento', 'observacao', 'parcelas'],
    );
  };

  if (loading) return <LoadingState label="Carregando historico..." />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Historico"
        description="Consulte todos os lancamentos e movimentacoes registrados pelo usuario."
        action={
          <button type="button" className="btn-secondary w-full sm:w-auto" onClick={exportHistory}>
            <Download className="h-4 w-4" />
            Exportar
          </button>
        }
      />
      <Alert variant="error">{actionError}</Alert>

      <section className="panel grid gap-3 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-4">
        <FormField id="histProduto" label="Produto">
          <input id="histProduto" value={filters.produto} onChange={(event) => updateFilter('produto', event.target.value)} placeholder="Codigo ou nome" />
        </FormField>
        <FormField id="histFornecedor" label="Fornecedor">
          <input id="histFornecedor" value={filters.fornecedor} onChange={(event) => updateFilter('fornecedor', event.target.value)} />
        </FormField>
        <FormField id="histTipo" label="Tipo">
          <select id="histTipo" value={filters.tipo} onChange={(event) => updateFilter('tipo', event.target.value)}>
            <option value="">Todos</option>
            <option value="despesa">Despesa</option>
            <option value="receita">Receita</option>
          </select>
        </FormField>
        <FormField id="histConta" label="Conta">
          <input id="histConta" value={filters.conta} onChange={(event) => updateFilter('conta', event.target.value)} />
        </FormField>
        <FormField id="histSubConta" label="Subconta">
          <input id="histSubConta" value={filters.subConta} onChange={(event) => updateFilter('subConta', event.target.value)} />
        </FormField>
        <FormField id="histStatus" label="Status financeiro">
          <select id="histStatus" value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
            <option value="">Todos</option>
            <option value="aberto">Aberto</option>
            <option value="vencido">Vencido</option>
            <option value="pago">Pago</option>
            <option value="atrasado">Atrasado</option>
            <option value="recebido">Recebido</option>
          </select>
        </FormField>
        <FormField id="histStart" label="Data inicial">
          <input id="histStart" type="date" value={filters.dataInicial} onChange={(event) => updateFilter('dataInicial', event.target.value)} />
        </FormField>
        <FormField id="histEnd" label="Data final">
          <input id="histEnd" type="date" value={filters.dataFinal} onChange={(event) => updateFilter('dataFinal', event.target.value)} />
        </FormField>
        <div className="flex items-end">
          <button type="button" className="btn-secondary w-full" onClick={() => setFilters(initialFilters)}>
            Limpar filtros
          </button>
        </div>
      </section>

      {!filteredMovements.length ? (
        <EmptyState title="Nenhuma movimentacao encontrada" description="Ajuste os filtros ou registre um novo lancamento." />
      ) : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {['Data', 'Produto', 'Fornecedor', 'Tipo', 'Conta', 'Subconta', 'Status', 'Vencimento', 'Qtd.', 'Valor total', 'Unitario', 'Parcelas'].map((label) => (
                    <th key={label} className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredMovements.map((movement, index) => (
                  <tr key={movement.id} className={`${index % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'} transition hover:bg-blue-50/60`}>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">{formatDate(movement.dataReferencia)}</td>
                    <td className="min-w-56 px-4 py-3.5">
                      <p className="font-mono text-xs font-bold text-slate-700">{movement.produtoCodigo}</p>
                      <p className="text-sm font-bold text-slate-900">{movement.produtoNome}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">{movement.fornecedorNome || '-'}</td>
                    <td className="whitespace-nowrap px-4 py-3.5"><StatusBadge value={movement.tipo} /></td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">{getContaName(movement) || '-'}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">{getSubcontaName(movement) || '-'}</td>
                    <td className="whitespace-nowrap px-4 py-3.5"><StatusBadge value={movement.financeiro.status} /></td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">{formatDate(movement.financeiro.vencimento)}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm font-bold text-slate-800">{movement.quantidade}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm font-bold text-slate-800">{formatCurrency(movement.valorTotal)}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">{formatCurrency(movement.valorUnitario)}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">{movement.possuiParcelamento ? `${movement.parcelas}x` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
