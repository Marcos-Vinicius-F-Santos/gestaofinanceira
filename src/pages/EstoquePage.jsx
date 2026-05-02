import { Download } from 'lucide-react';
import { useMemo, useState } from 'react';
import StockForm from '../components/stock/StockForm';
import StockTable from '../components/stock/StockTable';
import Alert from '../components/shared/Alert';
import LoadingState from '../components/shared/LoadingState';
import PageHeader from '../components/shared/PageHeader';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { normalizeProduto } from '../services/produtoService';
import { createMovimentacao } from '../services/stockService';
import { exportToCSV } from '../utils/csv';

export default function EstoquePage() {
  const { items, loading, error } = useFirestoreCollection('estoque');
  const {
    items: movements,
    loading: movementsLoading,
    error: movementsError,
  } = useFirestoreCollection('movimentacoes');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [actionError, setActionError] = useState('');
  const sortedProducts = useMemo(
    () => items.map(normalizeProduto).sort((a, b) => String(a.codigo || a.nome || '').localeCompare(String(b.codigo || b.nome || ''))),
    [items],
  );
  const sortedMovements = useMemo(
    () => [...movements].sort((a, b) => String(b.data || b.createdAt || '').localeCompare(String(a.data || a.createdAt || ''))),
    [movements],
  );

  const handleMovement = async (payload) => {
    setSubmitting(true);
    setFeedback('');
    setActionError('');

    try {
      await createMovimentacao(payload);
      setFeedback('Movimentacao registrada.');
    } catch (err) {
      setActionError(err.message || 'Nao foi possivel atualizar o estoque.');
    } finally {
      setSubmitting(false);
    }
  };

  const exportStock = () => {
    exportToCSV(
      'estoque.csv',
      sortedProducts.map((item) => ({
        codigo: item.codigo || '',
        nome: item.nome || '',
        unidadeMedida: item.unidadeMedida || '',
        quantidadeAtual: item.quantidadeAtual || 0,
        estoqueMinimo: item.estoqueMinimo || '',
      })),
      ['codigo', 'nome', 'unidadeMedida', 'quantidadeAtual', 'estoqueMinimo'],
    );
  };

  const exportMovements = () => {
    exportToCSV(
      'movimentacoes.csv',
      sortedMovements.map((item) => ({
        produtoCodigo: item.produtoCodigo || '',
        tipo: item.tipo || item.tipoMovimentacao || '',
        quantidade: item.quantidade || 0,
        data: item.data || '',
        observacao: item.observacao || '',
        saldoAnterior: item.saldoAnterior ?? '',
        saldoPosterior: item.saldoPosterior ?? '',
      })),
      ['produtoCodigo', 'tipo', 'quantidade', 'data', 'observacao', 'saldoAnterior', 'saldoPosterior'],
    );
  };

  if (loading || movementsLoading) return <LoadingState label="Carregando estoque..." />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Estoque"
        description="Controle produtos por codigo unico e acompanhe o historico completo de movimentacoes."
        action={
          <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-2">
            <button type="button" className="btn-secondary w-full" onClick={exportStock}>
              <Download className="h-4 w-4" />
              Exportar estoque
            </button>
            <button type="button" className="btn-secondary w-full" onClick={exportMovements}>
              <Download className="h-4 w-4" />
              Exportar movimentos
            </button>
          </div>
        }
      />
      <Alert variant="error">{error || movementsError || actionError}</Alert>
      <Alert variant="success">{feedback}</Alert>
      <div className="grid gap-4 sm:gap-6 xl:grid-cols-[380px_1fr]">
        <StockForm onSubmit={handleMovement} submitting={submitting} products={sortedProducts} />
        <StockTable items={sortedProducts} movements={sortedMovements} />
      </div>
    </div>
  );
}
