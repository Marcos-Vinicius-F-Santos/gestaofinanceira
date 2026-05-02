import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Alert from '../components/shared/Alert';
import Button from '../components/shared/Button';
import EmptyState from '../components/shared/EmptyState';
import FormField from '../components/shared/FormField';
import LoadingState from '../components/shared/LoadingState';
import Modal from '../components/shared/Modal';
import PageHeader from '../components/shared/PageHeader';
import StatusBadge from '../components/shared/StatusBadge';
import { useDataScope } from '../hooks/useDataScope';
import {
  createConta,
  createSubconta,
  getContas,
  getSubcontas,
  inativarConta,
  inativarSubconta,
  updateConta,
  updateSubconta,
} from '../services/planoContasService';

const emptyConta = { nome: '', tipo: 'despesa', ativo: true };
const emptySubconta = { contaId: '', nome: '', ativo: true };

export default function PlanoContasPage() {
  const scope = useDataScope();
  const [contas, setContas] = useState([]);
  const [subcontas, setSubcontas] = useState([]);
  const [selectedContaId, setSelectedContaId] = useState('');
  const [modalType, setModalType] = useState('');
  const [currentItem, setCurrentItem] = useState(null);
  const [form, setForm] = useState(emptyConta);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
      const loadedContas = await getContas(scope);
      const selectedExists = loadedContas.some((conta) => conta.id === selectedContaId);
      const nextSelectedContaId = selectedExists ? selectedContaId : '';
      const loadedSubcontas = nextSelectedContaId ? await getSubcontas(scope, nextSelectedContaId) : [];

      setContas(loadedContas);
      setSubcontas(loadedSubcontas);
      setSelectedContaId(nextSelectedContaId);
    } catch (err) {
      setActionError(err.message || 'Nao foi possivel carregar o plano de contas.');
    } finally {
      setLoading(false);
    }
  }, [scope, selectedContaId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedConta = useMemo(
    () => contas.find((conta) => conta.id === selectedContaId) || null,
    [contas, selectedContaId],
  );
  const visibleSubcontas = useMemo(
    () => subcontas.filter((subconta) => subconta.contaId === selectedContaId),
    [selectedContaId, subcontas],
  );
  const formConta = useMemo(
    () => contas.find((conta) => conta.id === form.contaId) || selectedConta,
    [contas, form.contaId, selectedConta],
  );

  const openContaModal = (conta = null) => {
    setCurrentItem(conta);
    setForm(conta ? { nome: conta.nome, tipo: conta.tipo, ativo: conta.ativo } : emptyConta);
    setModalType('conta');
  };

  const openSubcontaModal = (subconta = null) => {
    if (!subconta && !selectedContaId) return;

    setCurrentItem(subconta);
    setForm(subconta ? { contaId: subconta.contaId, nome: subconta.nome, ativo: subconta.ativo } : { ...emptySubconta, contaId: selectedContaId });
    setModalType('subconta');
  };

  const closeModal = () => {
    setModalType('');
    setCurrentItem(null);
    setForm(emptyConta);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback('');
    setActionError('');

    try {
      if (modalType === 'conta') {
        if (currentItem) {
          await updateConta(currentItem.id, form);
          setFeedback('Conta atualizada.');
        } else {
          await createConta(form, scope);
          setFeedback('Conta criada.');
        }
      } else if (currentItem) {
        await updateSubconta(currentItem.id, { nome: form.nome, ativo: form.ativo });
        setFeedback('Subconta atualizada.');
      } else {
        await createSubconta({ ...form, contaId: selectedContaId }, scope);
        setFeedback('Subconta criada.');
      }

      closeModal();
      await loadData();
    } catch (err) {
      setActionError(err.message || 'Nao foi possivel salvar.');
    } finally {
      setSubmitting(false);
    }
  };

  const inactivateConta = async (id) => {
    setFeedback('');
    setActionError('');
    try {
      await inativarConta(id);
      setFeedback('Conta inativada.');
      await loadData();
    } catch (err) {
      setActionError(err.message || 'Nao foi possivel inativar a conta.');
    }
  };

  const inactivateSubconta = async (id) => {
    setFeedback('');
    setActionError('');
    try {
      await inativarSubconta(id);
      setFeedback('Subconta inativada.');
      await loadData();
    } catch (err) {
      setActionError(err.message || 'Nao foi possivel inativar a subconta.');
    }
  };

  if (loading) return <LoadingState label="Carregando plano de contas..." />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Plano de Contas"
        description="Classifique receitas e despesas com contas e subcontas simples."
        action={
          <button type="button" className="btn-primary w-full sm:w-auto" onClick={() => openContaModal()}>
            <Plus className="h-4 w-4" />
            Nova Conta
          </button>
        }
      />
      <Alert variant="error">{actionError}</Alert>
      <Alert variant="success">{feedback}</Alert>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm font-bold text-ink">Contas</p>
            <button type="button" className="btn-secondary" onClick={() => openContaModal()}>
              <Plus className="h-4 w-4" />
              Conta
            </button>
          </div>
          {!contas.length ? (
            <div className="p-4"><EmptyState title="Nenhuma conta cadastrada" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-white">
                  <tr>
                    {['Nome', 'Tipo', 'Status', 'Acoes'].map((label) => (
                      <th key={label} className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {contas.map((conta) => (
                    <tr key={conta.id} className={`${selectedContaId === conta.id ? 'bg-blue-50/70' : 'bg-white'} transition hover:bg-blue-50/60`}>
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <button type="button" className="text-sm font-bold text-slate-900" onClick={() => setSelectedContaId(conta.id)}>
                          {conta.nome}
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5"><StatusBadge value={conta.tipo} /></td>
                      <td className="whitespace-nowrap px-4 py-3.5"><StatusBadge value={conta.ativo ? 'ativo' : 'inativo'} /></td>
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <div className="flex gap-2">
                          <button type="button" className="table-action" onClick={() => openContaModal(conta)} aria-label="Editar conta">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button type="button" className="table-action text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700" onClick={() => inactivateConta(conta.id)} aria-label="Inativar conta">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-sm font-bold text-ink">Subcontas</p>
              <p className="text-xs text-slate-500">{selectedConta ? selectedConta.nome : 'Selecione uma conta'}</p>
            </div>
            <button type="button" className="btn-secondary" onClick={() => openSubcontaModal()} disabled={!selectedContaId}>
              <Plus className="h-4 w-4" />
              Nova Subconta
            </button>
          </div>
          {!selectedContaId ? (
            <div className="p-4"><EmptyState title="Selecione uma conta para visualizar as subcontas." /></div>
          ) : !visibleSubcontas.length ? (
            <div className="p-4"><EmptyState title="Nenhuma subconta cadastrada" description="Crie uma nova subconta vinculada a esta conta." /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-white">
                  <tr>
                    {['Nome', 'Status', 'Acoes'].map((label) => (
                      <th key={label} className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {visibleSubcontas.map((subconta) => (
                    <tr key={subconta.id} className="transition hover:bg-blue-50/60">
                      <td className="whitespace-nowrap px-4 py-3.5 text-sm font-bold text-slate-900">{subconta.nome}</td>
                      <td className="whitespace-nowrap px-4 py-3.5"><StatusBadge value={subconta.ativo ? 'ativo' : 'inativo'} /></td>
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <div className="flex gap-2">
                          <button type="button" className="table-action" onClick={() => openSubcontaModal(subconta)} aria-label="Editar subconta">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button type="button" className="table-action text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700" onClick={() => inactivateSubconta(subconta.id)} aria-label="Inativar subconta">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {modalType ? (
        <Modal title={modalType === 'conta' ? (currentItem ? 'Editar conta' : 'Nova conta') : (currentItem ? 'Editar subconta' : 'Nova subconta')} onClose={closeModal}>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 p-3 sm:p-4">
              {modalType === 'subconta' ? (
                <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Conta vinculada</p>
                  <p className="mt-1 font-semibold">{formConta?.nome || 'Conta selecionada'}</p>
                </div>
              ) : (
                <FormField id="contaTipo" label="Tipo">
                  <select id="contaTipo" value={form.tipo} onChange={(event) => setForm({ ...form, tipo: event.target.value })}>
                    <option value="despesa">Despesa</option>
                    <option value="receita">Receita</option>
                  </select>
                </FormField>
              )}
              <FormField id="contaNome" label="Nome">
                <input id="contaNome" value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} required />
              </FormField>
              <label htmlFor="contaAtivo" className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold normal-case tracking-normal text-slate-700">
                <input id="contaAtivo" type="checkbox" className="h-4 w-4" checked={form.ativo} onChange={(event) => setForm({ ...form, ativo: event.target.checked })} />
                Ativo
              </label>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button variant="secondary" className="w-full sm:w-auto" onClick={closeModal}>Cancelar</Button>
                <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>Salvar</Button>
              </div>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
