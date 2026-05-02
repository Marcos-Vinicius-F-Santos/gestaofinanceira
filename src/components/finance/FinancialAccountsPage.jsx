import { CalendarDays, Check, Download, Eye } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDataScope } from '../../hooks/useDataScope';
import { getMovimentacoes } from '../../services/movimentacaoService';
import {
  editarVencimentoParcela,
  getParcelasByTipo,
  getStatusContaPagar,
  getStatusContaReceber,
  marcarParcelaPaga,
  marcarParcelaRecebida,
} from '../../services/parcelaService';
import { exportToCSV } from '../../utils/csv';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Alert from '../shared/Alert';
import EmptyState from '../shared/EmptyState';
import FormField from '../shared/FormField';
import LoadingState from '../shared/LoadingState';
import Modal from '../shared/Modal';
import PageHeader from '../shared/PageHeader';
import StatusBadge from '../shared/StatusBadge';

const emptyFilters = {
  status: '',
  pessoa: '',
  conta: '',
  subConta: '',
  dataInicial: '',
  dataFinal: '',
};

export default function FinancialAccountsPage({ mode }) {
  const isPayable = mode === 'pagar';
  const tipo = isPayable ? 'despesa' : 'receita';
  const scope = useDataScope();
  const [parcelas, setParcelas] = useState([]);
  const [movements, setMovements] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [actionError, setActionError] = useState('');

  const loadData = useCallback(async () => {
    if (!scope.effectiveUserId) return;
    setLoading(true);
    setActionError('');

    try {
      const [loadedParcelas, loadedMovements] = await Promise.all([
        getParcelasByTipo(tipo, scope),
        getMovimentacoes(scope),
      ]);
      setParcelas(loadedParcelas);
      setMovements(loadedMovements);
    } catch (err) {
      setActionError(err.message || 'Nao foi possivel carregar contas.');
    } finally {
      setLoading(false);
    }
  }, [scope, tipo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const movementById = useMemo(
    () => Object.fromEntries(movements.map((movement) => [movement.id, movement])),
    [movements],
  );

  const rows = useMemo(
    () => parcelas.map((parcela) => {
      const movement = movementById[parcela.movimentacaoId];
      const status = isPayable ? getStatusContaPagar(parcela) : getStatusContaReceber(parcela);
      return { ...parcela, movement, statusFinanceiro: status };
    }),
    [isPayable, movementById, parcelas],
  );

  const filteredRows = useMemo(
    () => rows.filter((row) => {
      const person = String(row.fornecedorNome || row.movement?.fornecedorNome || '').toLowerCase();
      const conta = String(row.conta || row.movement?.conta || '').toLowerCase();
      const subConta = String(row.subConta || row.movement?.subConta || '').toLowerCase();
      const matchesStatus = !filters.status || row.statusFinanceiro === filters.status;
      const matchesPerson = !filters.pessoa || person.includes(filters.pessoa.toLowerCase());
      const matchesConta = !filters.conta || conta.includes(filters.conta.toLowerCase());
      const matchesSubConta = !filters.subConta || subConta.includes(filters.subConta.toLowerCase());
      const matchesStart = !filters.dataInicial || row.dataVencimento >= filters.dataInicial;
      const matchesEnd = !filters.dataFinal || row.dataVencimento <= filters.dataFinal;
      return matchesStatus && matchesPerson && matchesConta && matchesSubConta && matchesStart && matchesEnd;
    }),
    [filters, rows],
  );

  const updateFilter = (field, value) => setFilters((prev) => ({ ...prev, [field]: value }));

  const settle = async (row) => {
    setFeedback('');
    setActionError('');

    try {
      if (isPayable) {
        await marcarParcelaPaga(row.id);
        setFeedback('Conta marcada como paga.');
      } else {
        await marcarParcelaRecebida(row.id);
        setFeedback('Conta marcada como recebida.');
      }
      await loadData();
    } catch (err) {
      setActionError(err.message || 'Nao foi possivel atualizar a conta.');
    }
  };

  const editDueDate = async (row) => {
    const nextDate = window.prompt('Nova data de vencimento (AAAA-MM-DD):', row.dataVencimento || '');
    if (!nextDate) return;

    setFeedback('');
    setActionError('');

    try {
      await editarVencimentoParcela(row.id, nextDate);
      setFeedback('Vencimento atualizado.');
      await loadData();
    } catch (err) {
      setActionError(err.message || 'Nao foi possivel editar o vencimento.');
    }
  };

  const exportRows = () => {
    exportToCSV(
      isPayable ? 'contas-a-pagar.csv' : 'contas-a-receber.csv',
      filteredRows.map((row) => ({
        pessoa: row.fornecedorNome || row.movement?.fornecedorNome || '',
        produtoDescricao: row.produtoNome || row.movement?.produtoNome || row.movement?.descricao || '',
        conta: row.conta || row.movement?.conta || '',
        subConta: row.subConta || row.movement?.subConta || '',
        valor: row.valorParcela,
        vencimento: row.dataVencimento,
        status: row.statusFinanceiro,
        parcela: `${row.numeroParcela}/${row.totalParcelas}`,
        movimentacaoId: row.movimentacaoId,
      })),
      ['pessoa', 'produtoDescricao', 'conta', 'subConta', 'valor', 'vencimento', 'status', 'parcela', 'movimentacaoId'],
    );
  };

  if (loading) return <LoadingState label={isPayable ? 'Carregando contas a pagar...' : 'Carregando contas a receber...'} />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title={isPayable ? 'Contas a Pagar' : 'Contas a Receber'}
        description={isPayable ? 'Parcelas e despesas com status calculado pelo vencimento.' : 'Receitas a receber com controle de atraso e recebimento.'}
        action={
          <button type="button" className="btn-secondary w-full sm:w-auto" onClick={exportRows}>
            <Download className="h-4 w-4" />
            Exportar
          </button>
        }
      />
      <Alert variant="error">{actionError}</Alert>
      <Alert variant="success">{feedback}</Alert>

      <section className="panel grid gap-3 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-4">
        <FormField id={`${mode}Status`} label="Status">
          <select id={`${mode}Status`} value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
            <option value="">Todos</option>
            <option value="aberto">Aberto</option>
            <option value={isPayable ? 'vencido' : 'atrasado'}>{isPayable ? 'Vencido' : 'Atrasado'}</option>
            <option value={isPayable ? 'pago' : 'recebido'}>{isPayable ? 'Pago' : 'Recebido'}</option>
          </select>
        </FormField>
        <FormField id={`${mode}Pessoa`} label={isPayable ? 'Fornecedor' : 'Cliente/fornecedor'}>
          <input id={`${mode}Pessoa`} value={filters.pessoa} onChange={(event) => updateFilter('pessoa', event.target.value)} />
        </FormField>
        <FormField id={`${mode}Conta`} label="Conta">
          <input id={`${mode}Conta`} value={filters.conta} onChange={(event) => updateFilter('conta', event.target.value)} />
        </FormField>
        <FormField id={`${mode}SubConta`} label="Subconta">
          <input id={`${mode}SubConta`} value={filters.subConta} onChange={(event) => updateFilter('subConta', event.target.value)} />
        </FormField>
        <FormField id={`${mode}Start`} label="Data inicial">
          <input id={`${mode}Start`} type="date" value={filters.dataInicial} onChange={(event) => updateFilter('dataInicial', event.target.value)} />
        </FormField>
        <FormField id={`${mode}End`} label="Data final">
          <input id={`${mode}End`} type="date" value={filters.dataFinal} onChange={(event) => updateFilter('dataFinal', event.target.value)} />
        </FormField>
        <div className="flex items-end">
          <button type="button" className="btn-secondary w-full" onClick={() => setFilters(emptyFilters)}>
            Limpar
          </button>
        </div>
      </section>

      {!filteredRows.length ? (
        <EmptyState title="Nenhuma conta encontrada" description="Ajuste os filtros ou registre um novo lancamento." />
      ) : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {[(isPayable ? 'Fornecedor' : 'Cliente/fornecedor'), 'Produto', 'Conta', 'Subconta', 'Valor', 'Vencimento', 'Parcela', 'Status', 'Acoes'].map((label) => (
                    <th key={label} className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredRows.map((row, index) => (
                  <tr key={row.id} className={`${index % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'} transition hover:bg-blue-50/60`}>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm font-bold text-slate-800">{row.fornecedorNome || row.movement?.fornecedorNome || '-'}</td>
                    <td className="min-w-56 px-4 py-3.5 text-sm text-slate-600">{row.produtoNome || row.movement?.produtoNome || row.movement?.descricao || '-'}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">{row.conta || row.movement?.conta || '-'}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">{row.subConta || row.movement?.subConta || '-'}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm font-bold text-slate-800">{formatCurrency(row.valorParcela)}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">{formatDate(row.dataVencimento)}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">{row.numeroParcela}/{row.totalParcelas}</td>
                    <td className="whitespace-nowrap px-4 py-3.5"><StatusBadge value={row.statusFinanceiro} /></td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <div className="flex gap-2">
                        <button type="button" className="table-action" onClick={() => settle(row)} disabled={['pago', 'recebido'].includes(row.statusFinanceiro)} aria-label={isPayable ? 'Marcar como pago' : 'Marcar como recebido'}>
                          <Check className="h-4 w-4" />
                        </button>
                        <button type="button" className="table-action" onClick={() => editDueDate(row)} aria-label="Editar vencimento">
                          <CalendarDays className="h-4 w-4" />
                        </button>
                        <button type="button" className="table-action" onClick={() => setSelectedMovement(row.movement)} aria-label="Visualizar lancamento original">
                          <Eye className="h-4 w-4" />
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

      {selectedMovement ? (
        <Modal title="Lancamento original" description="Dados da movimentacao vinculada a esta conta." onClose={() => setSelectedMovement(null)}>
          <div className="grid gap-3 p-4 text-sm sm:grid-cols-2">
            {Object.entries({
              Produto: selectedMovement.produtoNome,
              Fornecedor: selectedMovement.fornecedorNome,
              Tipo: selectedMovement.tipo,
              Conta: selectedMovement.conta,
              Subconta: selectedMovement.subConta,
              Descricao: selectedMovement.descricao,
              Quantidade: selectedMovement.quantidade,
              'Valor total': formatCurrency(selectedMovement.valorTotal),
              'Valor unitario': formatCurrency(selectedMovement.valorUnitario),
              'Data referencia': formatDate(selectedMovement.dataReferencia),
              Observacao: selectedMovement.observacao,
            }).map(([label, value]) => (
              <div key={label} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
                <p className="mt-1 font-semibold text-slate-800">{value || '-'}</p>
              </div>
            ))}
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
