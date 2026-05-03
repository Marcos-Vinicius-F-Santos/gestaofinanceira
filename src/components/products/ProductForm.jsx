import { useEffect, useState } from 'react';
import Button from '../shared/Button';
import FormField from '../shared/FormField';
import { getSubcontas } from '../../services/planoContasService';

const initialState = {
  codigo: '',
  nome: '',
  categoria: '',
  subcategoria: '',
  unidadeMedida: '',
  estoqueAtual: '0',
  contaPadraoId: '',
  contaPadraoNome: '',
  subcontaPadraoId: '',
  subcontaPadraoNome: '',
  controlaEstoque: true,
  ativo: true,
};

export default function ProductForm({ currentProduct, contas = [], scope, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(initialState);
  const [subcontasPadrao, setSubcontasPadrao] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!currentProduct) {
      setForm(initialState);
      setErrors({});
      return;
    }

    setForm({
      codigo: currentProduct.codigo || '',
      nome: currentProduct.nome || '',
      categoria: currentProduct.categoria || '',
      subcategoria: currentProduct.subcategoria || '',
      unidadeMedida: currentProduct.unidadeMedida || '',
      estoqueAtual: String(currentProduct.estoqueAtual ?? currentProduct.quantidadeAtual ?? 0),
      contaPadraoId: currentProduct.contaPadraoId || '',
      contaPadraoNome: currentProduct.contaPadraoNome || '',
      subcontaPadraoId: currentProduct.subcontaPadraoId || '',
      subcontaPadraoNome: currentProduct.subcontaPadraoNome || '',
      controlaEstoque: currentProduct.controlaEstoque !== false,
      ativo: currentProduct.ativo !== false,
    });
    setErrors({});
  }, [currentProduct]);

  useEffect(() => {
    let active = true;

    async function loadSubcontasPadrao() {
      if (!form.contaPadraoId || !scope?.effectiveUserId) {
        setSubcontasPadrao([]);
        return;
      }

      try {
        const loadedSubcontas = (await getSubcontas(scope, form.contaPadraoId)).filter((subconta) => subconta.ativo);
        if (!active) return;

        setSubcontasPadrao(loadedSubcontas);
        setForm((prev) => {
          if (prev.contaPadraoId !== form.contaPadraoId) return prev;
          const subcontaValida = !prev.subcontaPadraoId || loadedSubcontas.some((subconta) => subconta.id === prev.subcontaPadraoId);
          return subcontaValida ? prev : { ...prev, subcontaPadraoId: '', subcontaPadraoNome: '' };
        });
      } catch {
        if (active) setSubcontasPadrao([]);
      }
    }

    loadSubcontasPadrao();

    return () => {
      active = false;
    };
  }, [form.contaPadraoId, scope]);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const updateContaPadrao = (contaId) => {
    const conta = contas.find((item) => item.id === contaId);
    setForm((prev) => ({
      ...prev,
      contaPadraoId: conta?.id || '',
      contaPadraoNome: conta?.nome || '',
      subcontaPadraoId: '',
      subcontaPadraoNome: '',
    }));
  };
  const updateSubcontaPadrao = (subcontaId) => {
    const subconta = subcontasPadrao.find((item) => item.id === subcontaId);
    setForm((prev) => ({
      ...prev,
      subcontaPadraoId: subconta?.id || '',
      subcontaPadraoNome: subconta?.nome || '',
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};

    if (!form.codigo.trim()) nextErrors.codigo = 'Informe o codigo.';
    if (!form.nome.trim()) nextErrors.nome = 'Informe o nome.';
    if (Number.isNaN(Number(form.estoqueAtual))) nextErrors.estoqueAtual = 'Estoque atual deve ser numerico.';
    if (form.subcontaPadraoId && !form.contaPadraoId) nextErrors.subcontaPadraoId = 'Selecione a conta antes da subconta.';
    if (form.subcontaPadraoId && subcontasPadrao.length > 0 && !subcontasPadrao.some((subconta) => subconta.id === form.subcontaPadraoId)) {
      nextErrors.subcontaPadraoId = 'Subconta invalida para a conta selecionada.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    await onSubmit({
      ...form,
      estoqueAtual: Number(form.estoqueAtual || 0),
      ativo: form.ativo,
      userId: currentProduct?.userId,
    });

    if (!currentProduct) {
      setForm(initialState);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4 p-3 sm:p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="produtoCodigo" label="Codigo" error={errors.codigo}>
            <input id="produtoCodigo" value={form.codigo} onChange={(event) => update('codigo', event.target.value)} placeholder="Ex: MILHO-001" required />
          </FormField>
          <FormField id="produtoUnidade" label="Unidade">
            <input id="produtoUnidade" value={form.unidadeMedida} onChange={(event) => update('unidadeMedida', event.target.value)} placeholder="sc, kg, un..." />
          </FormField>
        </div>
        <FormField id="produtoNome" label="Nome" error={errors.nome}>
          <input id="produtoNome" value={form.nome} onChange={(event) => update('nome', event.target.value)} placeholder="Nome do produto" required />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="produtoCategoria" label="Categoria">
            <input id="produtoCategoria" value={form.categoria} onChange={(event) => update('categoria', event.target.value)} placeholder="Ex: Insumos" />
          </FormField>
          <FormField id="produtoSubcategoria" label="Subcategoria">
            <input id="produtoSubcategoria" value={form.subcategoria} onChange={(event) => update('subcategoria', event.target.value)} placeholder="Ex: Fertilizantes" />
          </FormField>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="mb-3 text-sm font-bold text-ink">Classificacao padrao</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="produtoContaPadrao" label="Conta padrao">
              <select id="produtoContaPadrao" value={form.contaPadraoId} onChange={(event) => updateContaPadrao(event.target.value)}>
                <option value="">Sem conta padrao</option>
                {contas.map((conta) => (
                  <option key={conta.id} value={conta.id}>
                    {conta.nome} ({conta.tipo})
                  </option>
                ))}
              </select>
            </FormField>
            <FormField id="produtoSubcontaPadrao" label="Subconta padrao" error={errors.subcontaPadraoId}>
              <select id="produtoSubcontaPadrao" value={form.subcontaPadraoId} onChange={(event) => updateSubcontaPadrao(event.target.value)} disabled={!form.contaPadraoId}>
                <option value="">Sem subconta padrao</option>
                {subcontasPadrao.map((subconta) => (
                  <option key={subconta.id} value={subconta.id}>
                    {subconta.nome}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <p className="mt-2 text-xs text-slate-500">Essa classificacao sera sugerida automaticamente no novo lancamento.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="produtoEstoqueAtual" label="Estoque atual" error={errors.estoqueAtual}>
            <input id="produtoEstoqueAtual" type="number" step="0.01" value={form.estoqueAtual} onChange={(event) => update('estoqueAtual', event.target.value)} />
          </FormField>
          <div className="flex items-end">
            <label htmlFor="produtoControlaEstoque" className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold normal-case tracking-normal text-slate-700">
              <input
                id="produtoControlaEstoque"
                type="checkbox"
                className="h-4 w-4"
                checked={form.controlaEstoque}
                onChange={(event) => update('controlaEstoque', event.target.checked)}
              />
              Controla estoque
            </label>
          </div>
        </div>
        <label htmlFor="produtoAtivo" className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold normal-case tracking-normal text-slate-700">
          <input
            id="produtoAtivo"
            type="checkbox"
            className="h-4 w-4"
            checked={form.ativo}
            onChange={(event) => update('ativo', event.target.checked)}
          />
          Produto ativo
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          {currentProduct ? (
            <Button variant="secondary" className="w-full sm:w-auto" onClick={onCancel}>
              Cancelar
            </Button>
          ) : null}
          <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
            {currentProduct ? 'Salvar produto' : 'Cadastrar produto'}
          </Button>
        </div>
      </div>
    </form>
  );
}
