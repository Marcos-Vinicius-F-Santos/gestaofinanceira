import { useState } from 'react';
import Button from '../shared/Button';
import FormField from '../shared/FormField';

const initialState = {
  codigoProduto: '',
  quantidade: '',
  tipo: 'entrada',
  data: new Date().toISOString().slice(0, 10),
  observacao: '',
};

export default function StockForm({ onSubmit, submitting, products = [] }) {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const normalizedCode = form.codigoProduto.trim().toUpperCase();
  const existingProduct = products.find((item) => item.codigo?.toUpperCase() === normalizedCode);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};

    if (!normalizedCode) nextErrors.codigoProduto = 'Informe o codigo do produto.';
    if (normalizedCode && !existingProduct) nextErrors.codigoProduto = 'Produto nao encontrado. Cadastre o produto antes de movimentar.';
    if (!form.quantidade || Number(form.quantidade) <= 0) nextErrors.quantidade = 'Informe uma quantidade maior que zero.';
    if (!form.data) nextErrors.data = 'Informe a data da movimentacao.';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    await onSubmit({
      codigo: normalizedCode,
      codigoProduto: normalizedCode,
      nomeProduto: existingProduct.nome,
      quantidade: Number(form.quantidade),
      tipo: form.tipo,
      data: form.data,
      observacao: form.observacao,
    });

    setForm(initialState);
    setErrors({});
  };

  return (
    <form className="panel overflow-hidden" onSubmit={handleSubmit}>
      <div className="border-b border-slate-200 bg-slate-50 px-3 py-3 sm:px-4">
        <p className="text-sm font-bold text-ink">Movimentar estoque</p>
        <p className="text-xs text-slate-500">Registre entradas e saidas de produtos.</p>
      </div>
      <div className="space-y-4 p-3 sm:p-4">
        <FormField id="codigoProduto" label="Codigo do produto" error={errors.codigoProduto}>
          <input
            id="codigoProduto"
            list="produtos-codigos"
            value={form.codigoProduto}
            onChange={(event) => update('codigoProduto', event.target.value)}
            placeholder="Digite ou selecione um codigo"
            required
          />
          <datalist id="produtos-codigos">
            {products.map((product) => (
              <option key={product.id} value={product.codigo}>
                {product.nome}
              </option>
            ))}
          </datalist>
        </FormField>
        <FormField id="nomeProduto" label="Nome do produto">
          <input
            id="nomeProduto"
            value={existingProduct?.nome || ''}
            placeholder={existingProduct ? 'Produto encontrado' : 'Preenchido automaticamente'}
            disabled
          />
        </FormField>
        {existingProduct ? (
          <div className="grid gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800 sm:grid-cols-2">
            <p>Saldo atual: <strong>{existingProduct.quantidadeAtual}</strong></p>
            <p>Unidade: <strong>{existingProduct.unidadeMedida || '-'}</strong></p>
          </div>
        ) : normalizedCode ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Produto nao encontrado. Cadastre o produto antes de movimentar.
          </div>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="quantidade" label="Quantidade" error={errors.quantidade}>
            <input id="quantidade" type="number" min="1" value={form.quantidade} onChange={(event) => update('quantidade', event.target.value)} required />
          </FormField>
          <FormField id="tipo" label="Movimentacao">
            <select id="tipo" value={form.tipo} onChange={(event) => update('tipo', event.target.value)}>
              <option value="entrada">Entrada</option>
              <option value="saida">Saida</option>
            </select>
          </FormField>
        </div>
        <FormField id="dataMovimentacao" label="Data" error={errors.data}>
          <input id="dataMovimentacao" type="date" value={form.data} onChange={(event) => update('data', event.target.value)} required />
        </FormField>
        <FormField id="observacao" label="Observacao">
          <textarea id="observacao" rows="3" value={form.observacao} onChange={(event) => update('observacao', event.target.value)} placeholder="Opcional" />
        </FormField>
        <Button type="submit" className="w-full" disabled={submitting}>
          Registrar movimentacao
        </Button>
      </div>
    </form>
  );
}
