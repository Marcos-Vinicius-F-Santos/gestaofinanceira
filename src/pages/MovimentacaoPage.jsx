import { Save } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Alert from '../components/shared/Alert';
import Button from '../components/shared/Button';
import FormField from '../components/shared/FormField';
import LoadingState from '../components/shared/LoadingState';
import PageHeader from '../components/shared/PageHeader';
import { useDataScope } from '../hooks/useDataScope';
import { getFornecedores } from '../services/fornecedorService';
import { createMovimentacao } from '../services/movimentacaoService';
import { getContas, getSubcontas } from '../services/planoContasService';
import { getProdutos } from '../services/produtoService';
import { formatCurrency } from '../utils/formatters';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

const initialForm = {
  produtoBusca: '',
  fornecedorBusca: '',
  tipo: 'despesa',
  centroCusto: '',
  responsavel: '',
  tipoLancamento: '',
  fazenda: '',
  contaId: '',
  subContaId: '',
  conta: '',
  subConta: '',
  descricao: '',
  quantidade: '1',
  valorTotal: '',
  dataReferencia: todayIso(),
  dataEmissao: todayIso(),
  numeroNota: '',
  observacao: '',
  controlaEstoque: false,
  movimentacaoEstoque: 'entrada',
  numeroParcelas: '1',
  primeiroVencimento: todayIso(),
};

export default function MovimentacaoPage() {
  const scope = useDataScope();
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [contas, setContas] = useState([]);
  const [subcontas, setSubcontas] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [actionError, setActionError] = useState('');

  const loadOptions = useCallback(async () => {
    if (!scope.effectiveUserId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setActionError('');

    try {
      const [loadedProducts, loadedSuppliers, loadedContas, loadedSubcontas] = await Promise.all([
        getProdutos(scope),
        getFornecedores(scope),
        getContas(scope),
        getSubcontas(scope),
      ]);
      setProducts(loadedProducts.filter((product) => product.ativo));
      setSuppliers(loadedSuppliers.filter((supplier) => supplier.ativo));
      setContas(loadedContas.filter((conta) => conta.ativo));
      setSubcontas(loadedSubcontas.filter((subconta) => subconta.ativo));
    } catch (err) {
      setActionError(err.message || 'Nao foi possivel carregar dados.');
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  const selectedProduct = useMemo(() => {
    const value = form.produtoBusca.trim().toLowerCase();
    if (!value) return null;
    return products.find((product) => product.codigo.toLowerCase() === value || product.nome.toLowerCase() === value) || null;
  }, [form.produtoBusca, products]);

  const selectedSupplier = useMemo(() => {
    const value = form.fornecedorBusca.trim().toLowerCase();
    if (!value) return null;
    return suppliers.find((supplier) => supplier.nomeFantasia.toLowerCase() === value || supplier.cnpj === value.replace(/\D/g, '')) || null;
  }, [form.fornecedorBusca, suppliers]);
  const contasDoTipo = useMemo(
    () => contas.filter((conta) => conta.tipo === form.tipo),
    [contas, form.tipo],
  );
  const selectedConta = useMemo(
    () => contas.find((conta) => conta.id === form.contaId) || null,
    [contas, form.contaId],
  );
  const subcontasDaConta = useMemo(
    () => subcontas.filter((subconta) => subconta.contaId === form.contaId),
    [form.contaId, subcontas],
  );
  const selectedSubconta = useMemo(
    () => subcontas.find((subconta) => subconta.id === form.subContaId) || null,
    [form.subContaId, subcontas],
  );

  const valorUnitario = useMemo(() => {
    const quantidade = Number(form.quantidade || 0);
    const valorTotal = Number(form.valorTotal || 0);
    return quantidade > 0 ? valorTotal / quantidade : 0;
  }, [form.quantidade, form.valorTotal]);

  const saldoPosterior = useMemo(() => {
    if (!selectedProduct || !form.controlaEstoque) return null;
    const saldoAnterior = Number(selectedProduct.estoqueAtual || 0);
    const quantidade = Number(form.quantidade || 0);
    return form.movimentacaoEstoque === 'saida' ? saldoAnterior - quantidade : saldoAnterior + quantidade;
  }, [form.controlaEstoque, form.movimentacaoEstoque, form.quantidade, selectedProduct]);

  useEffect(() => {
    if (selectedProduct) {
      setForm((prev) => ({ ...prev, controlaEstoque: selectedProduct.controlaEstoque }));
    }
  }, [selectedProduct]);

  useEffect(() => {
    setForm((prev) => {
      const contaAtualValida = contasDoTipo.some((conta) => conta.id === prev.contaId);
      if (contaAtualValida) return prev;
      return { ...prev, contaId: '', conta: '', subContaId: '', subConta: '' };
    });
  }, [contasDoTipo]);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const updateConta = (contaId) => {
    const conta = contas.find((item) => item.id === contaId);
    setForm((prev) => ({ ...prev, contaId, conta: conta?.nome || '', subContaId: '', subConta: '' }));
  };
  const updateSubconta = (subContaId) => {
    const subconta = subcontas.find((item) => item.id === subContaId);
    setForm((prev) => ({ ...prev, subContaId, subConta: subconta?.nome || '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback('');
    setActionError('');

    try {
      await createMovimentacao(
        {
          ...form,
          produtoId: selectedProduct?.id,
          produtoCodigo: selectedProduct?.codigo || form.produtoBusca,
          fornecedorId: selectedSupplier?.id,
          quantidade: Number(form.quantidade),
          valorTotal: Number(form.valorTotal || 0),
          numeroParcelas: Number(form.numeroParcelas || 1),
          possuiParcelamento: Number(form.numeroParcelas || 1) > 1,
          contaId: selectedConta?.id,
          conta: selectedConta?.nome,
          subContaId: selectedSubconta?.id,
          subConta: selectedSubconta?.nome,
        },
        scope,
      );
      setForm({ ...initialForm, dataReferencia: todayIso(), dataEmissao: todayIso(), primeiroVencimento: todayIso() });
      setFeedback('Movimentacao salva com sucesso.');
      await loadOptions();
    } catch (err) {
      setActionError(err.message || 'Nao foi possivel salvar a movimentacao.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState label="Carregando formulario..." />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader title="Novo Lancamento" description="Registre despesas, receitas e movimentacoes de estoque com historico completo de preco." />
      <Alert variant="error">{actionError}</Alert>
      <Alert variant="success">{feedback}</Alert>

      <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
        <section className="panel overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-3 py-3 sm:px-4">
            <p className="text-sm font-bold text-ink">Produto / Evento</p>
            <p className="text-xs text-slate-500">Digite codigo ou nome do produto e vincule um fornecedor/cliente cadastrado.</p>
          </div>
          <div className="grid gap-4 p-3 sm:p-4 md:grid-cols-2">
            <FormField id="movProduto" label="Produto">
              <input
                id="movProduto"
                list="produtosList"
                value={form.produtoBusca}
                onChange={(event) => update('produtoBusca', event.target.value)}
                placeholder="Codigo ou nome do produto"
                required
              />
              <datalist id="produtosList">
                {products.map((product) => (
                  <option key={product.id} value={product.codigo}>{product.nome}</option>
                ))}
              </datalist>
              {form.produtoBusca && !selectedProduct ? (
                <p className="mt-1.5 text-xs font-medium text-amber-700">Produto nao encontrado. Cadastre o produto antes de movimentar.</p>
              ) : null}
            </FormField>
            <FormField id="movFornecedor" label="Fornecedor / cliente">
              <input
                id="movFornecedor"
                list="fornecedoresList"
                value={form.fornecedorBusca}
                onChange={(event) => update('fornecedorBusca', event.target.value)}
                placeholder="Nome fantasia ou CNPJ"
                required
              />
              <datalist id="fornecedoresList">
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.nomeFantasia}>{supplier.cnpj}</option>
                ))}
              </datalist>
            </FormField>
            <div className="rounded-md border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800 md:col-span-2">
              {selectedProduct ? (
                <div className="grid gap-2 sm:grid-cols-3">
                  <p><strong>Produto:</strong> {selectedProduct.nome}</p>
                  <p><strong>Saldo anterior:</strong> {selectedProduct.controlaEstoque ? selectedProduct.estoqueAtual : 'Nao controla'}</p>
                  <p><strong>Unidade:</strong> {selectedProduct.unidadeMedida || '-'}</p>
                </div>
              ) : (
                <p>Selecione um produto cadastrado para preencher nome, saldo e unidade.</p>
              )}
            </div>
          </div>
        </section>

        <section className="panel overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-3 py-3 sm:px-4">
            <p className="text-sm font-bold text-ink">Classificacao</p>
          </div>
          <div className="grid gap-4 p-3 sm:p-4 md:grid-cols-3">
            <FormField id="movTipo" label="Tipo">
              <select id="movTipo" value={form.tipo} onChange={(event) => setForm((prev) => ({ ...prev, tipo: event.target.value, contaId: '', conta: '', subContaId: '', subConta: '' }))}>
                <option value="despesa">Despesa</option>
                <option value="receita">Receita</option>
              </select>
            </FormField>
            <FormField id="movConta" label="Conta">
              <select id="movConta" value={form.contaId} onChange={(event) => updateConta(event.target.value)} required>
                <option value="">Selecione</option>
                {contasDoTipo.map((conta) => (
                  <option key={conta.id} value={conta.id}>{conta.nome}</option>
                ))}
              </select>
            </FormField>
            <FormField id="movSubConta" label="Subconta">
              <select id="movSubConta" value={form.subContaId} onChange={(event) => updateSubconta(event.target.value)} required disabled={!form.contaId}>
                <option value="">Selecione</option>
                {subcontasDaConta.map((subconta) => (
                  <option key={subconta.id} value={subconta.id}>{subconta.nome}</option>
                ))}
              </select>
            </FormField>
            <FormField id="movCentroCusto" label="Centro de custo">
              <input id="movCentroCusto" value={form.centroCusto} onChange={(event) => update('centroCusto', event.target.value)} />
            </FormField>
            <FormField id="movResponsavel" label="Responsavel">
              <input id="movResponsavel" value={form.responsavel} onChange={(event) => update('responsavel', event.target.value)} />
            </FormField>
            <FormField id="movTipoLancamento" label="Tipo de lancamento">
              <input id="movTipoLancamento" value={form.tipoLancamento} onChange={(event) => update('tipoLancamento', event.target.value)} placeholder="Ex: compra, venda, ajuste" />
            </FormField>
            <FormField id="movFazenda" label="Fazenda">
              <input id="movFazenda" value={form.fazenda} onChange={(event) => update('fazenda', event.target.value)} />
            </FormField>
            <FormField id="movDescricao" label="Descricao">
              <input id="movDescricao" value={form.descricao} onChange={(event) => update('descricao', event.target.value)} />
            </FormField>
            <FormField id="movNumeroNota" label="Numero da nota">
              <input id="movNumeroNota" value={form.numeroNota} onChange={(event) => update('numeroNota', event.target.value)} />
            </FormField>
            <FormField id="movObservacao" label="Observacao">
              <textarea id="movObservacao" rows="3" value={form.observacao} onChange={(event) => update('observacao', event.target.value)} />
            </FormField>
          </div>
        </section>

        <section className="panel overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-3 py-3 sm:px-4">
            <p className="text-sm font-bold text-ink">Valores e prazos</p>
          </div>
          <div className="grid gap-4 p-3 sm:p-4 md:grid-cols-3">
            <FormField id="movQuantidade" label="Quantidade">
              <input id="movQuantidade" type="number" min="0.01" step="0.01" value={form.quantidade} onChange={(event) => update('quantidade', event.target.value)} required />
            </FormField>
            <FormField id="movValorTotal" label="Valor total">
              <input id="movValorTotal" type="number" min="0" step="0.01" value={form.valorTotal} onChange={(event) => update('valorTotal', event.target.value)} required />
            </FormField>
            <FormField id="movValorUnitario" label="Valor unitario calculado">
              <input id="movValorUnitario" value={formatCurrency(valorUnitario)} readOnly />
            </FormField>
            <FormField id="movDataReferencia" label="Data de referencia">
              <input id="movDataReferencia" type="date" value={form.dataReferencia} onChange={(event) => update('dataReferencia', event.target.value)} required />
            </FormField>
            <FormField id="movDataEmissao" label="Data de emissao">
              <input id="movDataEmissao" type="date" value={form.dataEmissao} onChange={(event) => update('dataEmissao', event.target.value)} />
            </FormField>
            <FormField id="movNumeroParcelas" label="Parcelas">
              <input id="movNumeroParcelas" type="number" min="1" step="1" value={form.numeroParcelas} onChange={(event) => update('numeroParcelas', event.target.value)} />
            </FormField>
            <FormField id="movPrimeiroVencimento" label="Primeiro vencimento">
              <input id="movPrimeiroVencimento" type="date" value={form.primeiroVencimento} onChange={(event) => update('primeiroVencimento', event.target.value)} />
            </FormField>
          </div>
        </section>

        <section className="panel overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-3 py-3 sm:px-4">
            <p className="text-sm font-bold text-ink">Estoque</p>
          </div>
          <div className="grid gap-4 p-3 sm:p-4 md:grid-cols-3">
            <div className="flex items-end">
              <label htmlFor="movControlaEstoque" className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold normal-case tracking-normal text-slate-700">
                <input id="movControlaEstoque" type="checkbox" className="h-4 w-4" checked={form.controlaEstoque} onChange={(event) => update('controlaEstoque', event.target.checked)} />
                Controla estoque
              </label>
            </div>
            <FormField id="movOperacaoEstoque" label="Entrada ou saida">
              <select id="movOperacaoEstoque" value={form.movimentacaoEstoque} onChange={(event) => update('movimentacaoEstoque', event.target.value)} disabled={!form.controlaEstoque}>
                <option value="entrada">Entrada</option>
                <option value="saida">Saida</option>
              </select>
            </FormField>
            <div className="rounded-md border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
              <p>Saldo anterior: <strong>{selectedProduct?.controlaEstoque ? selectedProduct.estoqueAtual : '-'}</strong></p>
              <p>Saldo posterior: <strong>{saldoPosterior ?? '-'}</strong></p>
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <Button type="submit" className="w-full sm:w-auto" disabled={submitting || !selectedProduct || !selectedSupplier || !selectedConta || !selectedSubconta}>
            <Save className="h-4 w-4" />
            Salvar lancamento
          </Button>
        </div>
      </form>
    </div>
  );
}
