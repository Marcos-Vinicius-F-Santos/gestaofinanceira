import { useEffect, useState } from 'react';
import Button from '../shared/Button';
import FormField from '../shared/FormField';

const initialState = {
  tipo: 'receita',
  descricao: '',
  valor: '',
  data: new Date().toISOString().slice(0, 10),
  clienteFornecedor: '',
  categoria: '',
  status: 'aberto',
};

export default function LancamentoForm({ currentItem, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (currentItem) {
      setForm({
        tipo: currentItem.tipo || 'receita',
        descricao: currentItem.descricao || '',
        valor: currentItem.valor || '',
        data: currentItem.data || new Date().toISOString().slice(0, 10),
        clienteFornecedor: currentItem.clienteFornecedor || '',
        categoria: currentItem.categoria || '',
        status: currentItem.status || 'aberto',
      });
      return;
    }

    setForm(initialState);
  }, [currentItem]);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const updateTipo = (value) => setForm((prev) => ({ ...prev, tipo: value, status: 'aberto' }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};

    if (!form.descricao.trim()) nextErrors.descricao = 'Informe uma descricao.';
    if (!form.valor || Number(form.valor) <= 0) nextErrors.valor = 'Informe um valor maior que zero.';
    if (!form.data) nextErrors.data = 'Informe uma data.';
    if (!form.categoria.trim()) nextErrors.categoria = 'Informe uma categoria.';
    if (!form.clienteFornecedor.trim()) nextErrors.clienteFornecedor = 'Informe cliente ou fornecedor.';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    await onSubmit({
      ...form,
      valor: Number(form.valor),
    });

    if (!currentItem) {
      setForm(initialState);
    }
  };

  return (
    <form className="panel overflow-hidden" onSubmit={handleSubmit}>
      <div className="border-b border-slate-200 bg-slate-50 px-3 py-3 sm:px-4">
        <p className="text-sm font-bold text-ink">{currentItem ? 'Editar lancamento' : 'Novo lancamento'}</p>
        <p className="text-xs text-slate-500">Preencha os dados financeiros do registro.</p>
      </div>
      <div className="space-y-5 p-3 sm:p-4">
        <section>
          <p className="section-title mb-3">Classificacao</p>
          <div className="grid gap-4 lg:grid-cols-2">
            <FormField id="tipo" label="Tipo">
              <select id="tipo" value={form.tipo} onChange={(event) => updateTipo(event.target.value)}>
                <option value="receita">Receita</option>
                <option value="despesa">Despesa</option>
              </select>
            </FormField>
            <FormField id="status" label="Status">
              <select id="status" value={form.status} onChange={(event) => update('status', event.target.value)}>
                <option value="aberto">Aberto</option>
                {form.tipo === 'despesa' ? <option value="pago">Pago</option> : null}
                {form.tipo === 'receita' ? <option value="recebido">Recebido</option> : null}
              </select>
            </FormField>
          </div>
        </section>

      <section>
        <p className="section-title mb-3">Detalhes</p>
        <div className="grid gap-4">
          <FormField id="descricao" label="Descricao" error={errors.descricao}>
            <input id="descricao" value={form.descricao} onChange={(event) => update('descricao', event.target.value)} placeholder="Ex: Venda no cartao" required />
          </FormField>

          <div className="grid gap-4 lg:grid-cols-3">
            <FormField id="valor" label="Valor" error={errors.valor}>
              <input id="valor" type="number" min="0" step="0.01" value={form.valor} onChange={(event) => update('valor', event.target.value)} placeholder="0,00" required />
            </FormField>
            <FormField id="data" label="Data" error={errors.data}>
              <input id="data" type="date" value={form.data} onChange={(event) => update('data', event.target.value)} required />
            </FormField>
            <FormField id="categoria" label="Categoria" error={errors.categoria}>
              <input id="categoria" value={form.categoria} onChange={(event) => update('categoria', event.target.value)} placeholder="Ex: Vendas" required />
            </FormField>
          </div>

          <FormField id="clienteFornecedor" label="Cliente / Fornecedor" error={errors.clienteFornecedor}>
            <input id="clienteFornecedor" value={form.clienteFornecedor} onChange={(event) => update('clienteFornecedor', event.target.value)} placeholder="Nome da pessoa ou empresa" required />
          </FormField>
        </div>
      </section>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        {currentItem ? (
          <Button variant="secondary" className="w-full sm:w-auto" onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
        <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
          {currentItem ? 'Salvar alteracoes' : 'Criar lancamento'}
        </Button>
      </div>
      </div>
    </form>
  );
}
