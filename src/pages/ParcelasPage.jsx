import { CalendarDays, Check, Download } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Alert from '../components/shared/Alert';
import EmptyState from '../components/shared/EmptyState';
import FormField from '../components/shared/FormField';
import LoadingState from '../components/shared/LoadingState';
import PageHeader from '../components/shared/PageHeader';
import StatusBadge from '../components/shared/StatusBadge';
import { useDataScope } from '../hooks/useDataScope';
import { getMovimentacoes } from '../services/movimentacaoService';
import { editarVencimentoParcela, getParcelas, getParcelaStatus, marcarParcelaPaga, marcarParcelaRecebida } from '../services/parcelaService';
import { exportToCSV } from '../utils/csv';
import { formatCurrency, formatDate } from '../utils/formatters';

const initialFilters = {
  status: '',
  fornecedor: '',
  dataInicial: '',
  dataFinal: '',
};

function getContaName(parcela) {
  return parcela.conta || parcela.contaNome || parcela.movement?.conta || parcela.movement?.contaNome || '';
}

function getSubcontaName(parcela) {
  return parcela.subConta || parcela.subcontaNome || parcela.movement?.subConta || parcela.movement?.subcontaNome || '';
}

export default function ParcelasPage() {
  const scope = useDataScope();
  const [parcelas, setParcelas] = useState([]);
  const [movements, setMovements] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [actionError, setActionError] = useState('');

  const loadData = useCallback(async () => {
    if (!scope.effectiveUserId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setActionError('');

    try {
      const [loadedParcelas, loadedMovements] = await Promise.all([getParcelas(scope), getMovimentacoes(scope)]);
      setParcelas(loadedParcelas);
      setMovements(loadedMovements);
    } catch (err) {
      setActionError(err.message || 'Nao foi possivel carregar parcelas.');
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const movementById = useMemo(
    () => Object.fromEntries(movements.map((movement) => [movement.id, movement])),
    [movements],
  );

  const enrichedParcelas = useMemo(
    () => parcelas.map((parcela) => ({
      ...parcela,
      movement: movementById[parcela.movimentacaoId],
      statusCalculado: getParcelaStatus(parcela),
    })),
    [parcelas, movementById],
  );

  const filteredParcelas = useMemo(
    () => enrichedParcelas.filter((parcela) => {
      const supplier = String(parcela.movement?.fornecedorNome || '').toLowerCase();
      const status = parcela.statusCalculado;
      const matchesStatus = !filters.status || status === filters.status;
      const matchesSupplier = !filters.fornecedor || supplier.includes(filters.fornecedor.toLowerCase());
      const matchesStart = !filters.dataInicial || parcela.dataVencimento >= filters.dataInicial;
      const matchesEnd = !filters.dataFinal || parcela.dataVencimento <= filters.dataFinal;

      return matchesStatus && matchesSupplier && matchesStart && matchesEnd;
    }),
    [enrichedParcelas, filters],
  );

  const updateFilter = (field, value) => setFilters((prev) => ({ ...prev, [field]: value }));

  const handleMarkPaid = async (id) => {
    setFeedback('');
    setActionError('');

    try {
      const parcela = parcelas.find((item) => item.id === id);
      if (parcela?.tipo === 'receita') {
        await marcarParcelaRecebida(id);
        setFeedback('Parcela marcada como recebida.');
      } else {
        await marcarParcelaPaga(id);
        setFeedback('Parcela marcada como paga.');
      }
      await loadData();
    } catch (err) {
      setActionError(err.message || 'Nao foi possivel atualizar a parcela.');
    }
  };

  const handleEditDue = async (parcela) => {
    const nextDate = window.prompt('Nova data de vencimento (AAAA-MM-DD):', parcela.dataVencimento || '');
    if (!nextDate) return;

    setFeedback('');
    setActionError('');

    try {
      await editarVencimentoParcela(parcela.id, nextDate);
      setFeedback('Vencimento atualizado.');
      await loadData();
    } catch (err) {
      setActionError(err.message || 'Nao foi possivel editar o vencimento.');
    }
  };

  const exportParcelas = () => {
    exportToCSV(
      'parcelas.csv',
      filteredParcelas.map((parcela) => ({
        dataVencimento: parcela.dataVencimento,
        status: parcela.statusCalculado,
        fornecedor: parcela.movement?.fornecedorNome || '',
        produto: parcela.movement?.produtoNome || '',
        conta: getContaName(parcela),
        subConta: getSubcontaName(parcela),
        numeroParcela: parcela.numeroParcela,
        totalParcelas: parcela.totalParcelas,
        valorParcela: parcela.valorParcela,
        dataPagamento: parcela.dataPagamento || '',
        movimentacaoId: parcela.movimentacaoId,
      })),
      ['dataVencimento', 'status', 'fornecedor', 'produto', 'conta', 'subConta', 'numeroParcela', 'totalParcelas', 'valorParcela', 'dataPagamento', 'movimentacaoId'],
    );
  };

  if (loading) return <LoadingState label="Carregando parcelas..." />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Parcelas"
        description="Controle vencimentos gerados pelos lancamentos parcelados."
        action={
          <button type="button" className="btn-secondary w-full sm:w-auto" onClick={exportParcelas}>
            <Download className="h-4 w-4" />
            Exportar
          </button>
        }
      />
      <Alert variant="error">{actionError}</Alert>
      <Alert variant="success">{feedback}</Alert>

      <section className="panel grid gap-3 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-5">
        <FormField id="parcelaStatus" label="Status">
          <select id="parcelaStatus" value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
            <option value="">Todos</option>
            <option value="aberto">Abertas</option>
            <option value="pago">Pagas</option>
            <option value="recebido">Recebidas</option>
            <option value="vencido">Vencidas</option>
            <option value="atrasado">Atrasadas</option>
          </select>
        </FormField>
        <FormField id="parcelaFornecedor" label="Fornecedor">
          <input id="parcelaFornecedor" value={filters.fornecedor} onChange={(event) => updateFilter('fornecedor', event.target.value)} />
        </FormField>
        <FormField id="parcelaStart" label="Data inicial">
          <input id="parcelaStart" type="date" value={filters.dataInicial} onChange={(event) => updateFilter('dataInicial', event.target.value)} />
        </FormField>
        <FormField id="parcelaEnd" label="Data final">
          <input id="parcelaEnd" type="date" value={filters.dataFinal} onChange={(event) => updateFilter('dataFinal', event.target.value)} />
        </FormField>
        <div className="flex items-end">
          <button type="button" className="btn-secondary w-full" onClick={() => setFilters(initialFilters)}>
            Limpar
          </button>
        </div>
      </section>

      {!filteredParcelas.length ? (
        <EmptyState title="Nenhuma parcela encontrada" description="Parcelas aparecem aqui quando um lancamento parcelado e salvo." />
      ) : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {['Vencimento', 'Status', 'Fornecedor', 'Produto', 'Conta', 'Subconta', 'Parcela', 'Valor', 'Movimentacao', 'Acoes'].map((label) => (
                    <th key={label} className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredParcelas.map((parcela, index) => (
                  <tr key={parcela.id} className={`${index % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'} transition hover:bg-blue-50/60`}>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">{formatDate(parcela.dataVencimento)}</td>
                    <td className="whitespace-nowrap px-4 py-3.5"><StatusBadge value={parcela.statusCalculado} /></td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm font-bold text-slate-800">{parcela.movement?.fornecedorNome || '-'}</td>
                    <td className="min-w-52 px-4 py-3.5 text-sm text-slate-600">{parcela.movement?.produtoNome || '-'}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">{getContaName(parcela) || '-'}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">{getSubcontaName(parcela) || '-'}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">{parcela.numeroParcela}/{parcela.totalParcelas}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm font-bold text-slate-800">{formatCurrency(parcela.valorParcela)}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs text-slate-500">{parcela.movimentacaoId}</td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <div className="flex gap-2">
                        <button type="button" className="table-action" onClick={() => handleEditDue(parcela)} aria-label="Editar vencimento">
                          <CalendarDays className="h-4 w-4" />
                        </button>
                        <button type="button" className="table-action text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800" onClick={() => handleMarkPaid(parcela.id)} disabled={['pago', 'recebido'].includes(parcela.statusCalculado)} aria-label="Marcar como paga ou recebida">
                          <Check className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
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
