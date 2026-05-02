import { Download } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Alert from '../components/shared/Alert';
import EmptyState from '../components/shared/EmptyState';
import FormField from '../components/shared/FormField';
import LoadingState from '../components/shared/LoadingState';
import PageHeader from '../components/shared/PageHeader';
import { useDataScope } from '../hooks/useDataScope';
import { getHistoricoPrecos } from '../services/movimentacaoService';
import { getProdutos } from '../services/produtoService';
import { exportToCSV } from '../utils/csv';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function HistoricoPrecosPage() {
  const scope = useDataScope();
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [actionError, setActionError] = useState('');

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) || null,
    [products, selectedProductId],
  );

  const loadProducts = useCallback(async () => {
    if (!scope.effectiveUserId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setActionError('');

    try {
      const loadedProducts = await getProdutos(scope);
      setProducts(loadedProducts.filter((product) => product.ativo));
      setSelectedProductId((current) => current || loadedProducts[0]?.id || '');
    } catch (err) {
      setActionError(err.message || 'Nao foi possivel carregar produtos.');
    } finally {
      setLoading(false);
    }
  }, [scope]);

  const loadPrices = useCallback(async () => {
    if (!selectedProductId) {
      setPrices([]);
      return;
    }

    setLoadingPrices(true);
    setActionError('');

    try {
      setPrices(await getHistoricoPrecos(selectedProductId, scope));
    } catch (err) {
      setActionError(err.message || 'Nao foi possivel carregar historico de precos.');
    } finally {
      setLoadingPrices(false);
    }
  }, [scope, selectedProductId]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    loadPrices();
  }, [loadPrices]);

  const exportPrices = () => {
    exportToCSV(
      'historico-precos.csv',
      prices.map((movement) => ({
        dataReferencia: movement.dataReferencia,
        produtoCodigo: movement.produtoCodigo,
        produtoNome: movement.produtoNome,
        fornecedorNome: movement.fornecedorNome,
        quantidade: movement.quantidade,
        valorTotal: movement.valorTotal,
        valorUnitario: movement.valorUnitario,
        observacao: movement.observacao,
        numeroNota: movement.numeroNota,
      })),
      ['dataReferencia', 'produtoCodigo', 'produtoNome', 'fornecedorNome', 'quantidade', 'valorTotal', 'valorUnitario', 'observacao', 'numeroNota'],
    );
  };

  if (loading) return <LoadingState label="Carregando historico de precos..." />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Historico de Precos"
        description="O preco do produto vem das movimentacoes, mantendo a evolucao por data e fornecedor."
        action={
          <button type="button" className="btn-secondary w-full sm:w-auto" onClick={exportPrices} disabled={!prices.length}>
            <Download className="h-4 w-4" />
            Exportar
          </button>
        }
      />
      <Alert variant="error">{actionError}</Alert>

      <section className="panel grid gap-3 p-3 sm:p-4 md:grid-cols-[1fr_auto] md:items-end">
        <FormField id="priceProduct" label="Produto">
          <select id="priceProduct" value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)}>
            <option value="">Selecione um produto</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.codigo} - {product.nome}
              </option>
            ))}
          </select>
        </FormField>
        {selectedProduct ? (
          <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800">
            Saldo atual: <strong>{selectedProduct.controlaEstoque ? selectedProduct.estoqueAtual : 'nao controla'}</strong>
          </div>
        ) : null}
      </section>

      {loadingPrices ? (
        <LoadingState label="Carregando precos..." />
      ) : !prices.length ? (
        <EmptyState title="Nenhum preco encontrado" description="Registre uma movimentacao para este produto." />
      ) : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {['Data', 'Fornecedor', 'Quantidade', 'Valor total', 'Valor unitario', 'Nota', 'Observacao'].map((label) => (
                    <th key={label} className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {prices.map((movement, index) => (
                  <tr key={movement.id} className={`${index % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'} transition hover:bg-blue-50/60`}>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">{formatDate(movement.dataReferencia)}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm font-bold text-slate-800">{movement.fornecedorNome || '-'}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">{movement.quantidade}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm font-bold text-slate-800">{formatCurrency(movement.valorTotal)}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm font-bold text-blue-700">{formatCurrency(movement.valorUnitario)}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">{movement.numeroNota || '-'}</td>
                    <td className="min-w-64 px-4 py-3.5 text-sm text-slate-600">{movement.observacao || '-'}</td>
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
