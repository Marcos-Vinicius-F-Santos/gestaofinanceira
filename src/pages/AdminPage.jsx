import { Ban, CheckCircle2, Download, Eye, Pencil, Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from '../components/shared/Alert';
import Button from '../components/shared/Button';
import EmptyState from '../components/shared/EmptyState';
import FormField from '../components/shared/FormField';
import LoadingState from '../components/shared/LoadingState';
import Modal from '../components/shared/Modal';
import PageHeader from '../components/shared/PageHeader';
import StatusBadge from '../components/shared/StatusBadge';
import { useAdminClient } from '../contexts/AdminClientContext';
import { useAuth } from '../contexts/AuthContext';
import { useDataScope } from '../hooks/useDataScope';
import { createClientUser, getClients, getMacroData, updateClientStatus, updateClientUser } from '../services/adminService';
import { exportToCSV } from '../utils/csv';
import { formatCurrency, formatDate } from '../utils/formatters';

const emptyClientForm = {
  nome: '',
  email: '',
  password: '',
  status: 'pending',
  observacoesInternas: '',
};

export default function AdminPage({ initialView = 'clientes' }) {
  const { user, isAdmin } = useAuth();
  const adminScope = useDataScope();
  const navigate = useNavigate();
  const { setSelectedClient } = useAdminClient();
  const [view, setView] = useState(initialView);
  const [clients, setClients] = useState([]);
  const [macro, setMacro] = useState({ totalAtivos: 0, totalBloqueados: 0, totalPendentes: 0, totalMovimentacoes: 0, rows: [] });
  const [currentClient, setCurrentClient] = useState(null);
  const [clientForm, setClientForm] = useState(emptyClientForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [actionError, setActionError] = useState('');

  const loadData = useCallback(async () => {
    if (!adminScope.uid || !isAdmin) return;
    setLoading(true);
    setActionError('');

    try {
      const [loadedClients, loadedMacro] = await Promise.all([getClients(), getMacroData(adminScope)]);
      setClients(loadedClients);
      setMacro(loadedMacro);
    } catch (err) {
      setActionError(err.message || 'Nao foi possivel carregar clientes.');
    } finally {
      setLoading(false);
    }
  }, [adminScope, isAdmin]);

  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openNewClient = () => {
    setCurrentClient(null);
    setClientForm(emptyClientForm);
    setModalOpen(true);
  };

  const openEditClient = (client) => {
    setCurrentClient(client);
    setClientForm({
      nome: client.nome || '',
      email: client.email || '',
      password: '',
      status: client.status || 'pending',
      observacoesInternas: client.observacoesInternas || '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentClient(null);
    setClientForm(emptyClientForm);
  };

  const handleSubmitClient = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback('');
    setActionError('');

    try {
      if (currentClient) {
        await updateClientUser(currentClient.uid, clientForm);
        setFeedback('Cliente atualizado com sucesso.');
      } else {
        await createClientUser({
          nome: clientForm.nome,
          email: clientForm.email,
          password: clientForm.password,
          status: clientForm.status,
          createdByAdminId: user?.uid || '',
        });
        setFeedback('Cliente cadastrado com sucesso.');
      }
      closeModal();
      await loadData();
    } catch (err) {
      setActionError(err.message || 'Nao foi possivel salvar o cliente.');
    } finally {
      setSubmitting(false);
    }
  };

  const setStatus = async (client, status) => {
    setFeedback('');
    setActionError('');

    try {
      await updateClientStatus(client.uid, status);
      setFeedback(status === 'active' ? 'Acesso liberado.' : 'Acesso bloqueado.');
      await loadData();
    } catch (err) {
      setActionError(err.message || 'Nao foi possivel atualizar o acesso.');
    }
  };

  const accessClient = (client) => {
    setSelectedClient(client);
    navigate('/produtos');
  };

  const exportCurrent = () => {
    if (view === 'macro') {
      exportToCSV('admin-visao-macro.csv', macro.rows, ['nome', 'email', 'status', 'movimentacoes', 'pagarAberto', 'receberAberto', 'vencido']);
      return;
    }

    exportToCSV('admin-clientes.csv', clients, ['uid', 'nome', 'email', 'status', 'createdAt', 'lastLoginAt']);
  };

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <PageHeader title="Admin" description="Area exclusiva para administradores." />
        <Alert variant="error">Voce nao tem permissao para acessar esta area.</Alert>
      </div>
    );
  }

  if (loading) return <LoadingState label="Carregando admin..." />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title={view === 'macro' ? 'Visao Macro' : 'Clientes'}
        description="Cadastre clientes, controle liberacao de acesso e entre na visao operacional de cada cliente."
        action={
          <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-2">
            {view === 'clientes' ? (
              <button type="button" className="btn-primary w-full" onClick={openNewClient}>
                <Plus className="h-4 w-4" />
                Novo Cliente
              </button>
            ) : null}
            <button type="button" className="btn-secondary w-full" onClick={exportCurrent}>
              <Download className="h-4 w-4" />
              Exportar
            </button>
          </div>
        }
      />
      <Alert variant="error">{actionError}</Alert>
      <Alert variant="success">{feedback}</Alert>

      <section className="panel p-2">
        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" className={`btn ${view === 'clientes' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'}`} onClick={() => setView('clientes')}>
            Clientes
          </button>
          <button type="button" className={`btn ${view === 'macro' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'}`} onClick={() => setView('macro')}>
            Visao Macro
          </button>
        </div>
      </section>

      {view === 'clientes' ? (
        <ClientsTable clients={clients} onAccess={accessClient} onEdit={openEditClient} onStatus={setStatus} />
      ) : (
        <MacroView macro={macro} />
      )}

      {modalOpen ? (
        <Modal title={currentClient ? 'Editar cliente' : 'Novo cliente'} description="Controle status de acesso e dados cadastrais." onClose={closeModal}>
          <form onSubmit={handleSubmitClient}>
            <div className="space-y-4 p-3 sm:p-4">
              <FormField id="clientNome" label="Nome">
                <input id="clientNome" value={clientForm.nome} onChange={(event) => setClientForm({ ...clientForm, nome: event.target.value })} required />
              </FormField>
              <FormField id="clientEmail" label="Email">
                <input id="clientEmail" type="email" value={clientForm.email} onChange={(event) => setClientForm({ ...clientForm, email: event.target.value })} required readOnly={Boolean(currentClient)} />
              </FormField>
              {!currentClient ? (
                <FormField id="clientPassword" label="Senha temporaria">
                  <input id="clientPassword" type="password" value={clientForm.password} onChange={(event) => setClientForm({ ...clientForm, password: event.target.value })} required />
                </FormField>
              ) : null}
              <FormField id="clientStatus" label="Status">
                <select id="clientStatus" value={clientForm.status} onChange={(event) => setClientForm({ ...clientForm, status: event.target.value })}>
                  <option value="pending">Pendente</option>
                  <option value="active">Ativo</option>
                  <option value="blocked">Bloqueado</option>
                </select>
              </FormField>
              <FormField id="clientNotes" label="Observacoes internas">
                <textarea id="clientNotes" rows="3" value={clientForm.observacoesInternas} onChange={(event) => setClientForm({ ...clientForm, observacoesInternas: event.target.value })} />
              </FormField>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                {currentClient ? (
                  <>
                    <Button variant="secondary" className="w-full sm:w-auto" onClick={() => setClientForm({ ...clientForm, status: 'active' })}>
                      Ativar
                    </Button>
                    <Button variant="danger" className="w-full sm:w-auto" onClick={() => setClientForm({ ...clientForm, status: 'blocked' })}>
                      Bloquear
                    </Button>
                  </>
                ) : null}
                <Button variant="secondary" className="w-full sm:w-auto" onClick={closeModal}>
                  Cancelar
                </Button>
                <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
                  Salvar
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}

function ClientsTable({ clients, onAccess, onEdit, onStatus }) {
  if (!clients.length) {
    return <EmptyState title="Nenhum cliente cadastrado" description="Use Novo Cliente para liberar o primeiro acesso." />;
  }

  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {['Nome', 'Email', 'Status', 'Criado em', 'Ultimo acesso', 'Acoes'].map((label) => (
                <th key={label} className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {clients.map((client, index) => (
              <tr key={client.uid} className={`${index % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'} transition hover:bg-blue-50/60`}>
                <td className="whitespace-nowrap px-4 py-3.5 text-sm font-bold text-slate-900">{client.nome}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">{client.email}</td>
                <td className="whitespace-nowrap px-4 py-3.5"><StatusBadge value={client.status} /></td>
                <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">{formatDate(client.createdAt)}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">{formatDate(client.lastLoginAt)}</td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <div className="flex gap-2">
                    <button type="button" className="table-action" onClick={() => onAccess(client)} aria-label="Acessar visao do cliente">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button type="button" className="table-action" onClick={() => onEdit(client)} aria-label="Editar cliente">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button type="button" className="table-action text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800" onClick={() => onStatus(client, 'active')} aria-label="Liberar acesso">
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                    <button type="button" className="table-action text-red-700 hover:border-red-200 hover:bg-red-50 hover:text-red-800" onClick={() => onStatus(client, 'blocked')} aria-label="Bloquear acesso">
                      <Ban className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MacroView({ macro }) {
  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <MacroCard label="Ativos" value={macro.totalAtivos} />
        <MacroCard label="Bloqueados" value={macro.totalBloqueados} />
        <MacroCard label="Pendentes" value={macro.totalPendentes} />
        <MacroCard label="Movimentacoes" value={macro.totalMovimentacoes} />
      </div>
      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {['Cliente', 'Status', 'Movimentacoes', 'A pagar aberto', 'A receber aberto', 'Vencido'].map((label) => (
                  <th key={label} className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {macro.rows.map((row, index) => (
                <tr key={row.userId} className={`${index % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'} transition hover:bg-blue-50/60`}>
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm font-bold text-slate-900">{row.nome}</td>
                  <td className="whitespace-nowrap px-4 py-3.5"><StatusBadge value={row.status} /></td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">{row.movimentacoes}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm font-bold text-red-700">{formatCurrency(row.pagarAberto)}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm font-bold text-emerald-700">{formatCurrency(row.receberAberto)}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm font-bold text-amber-700">{formatCurrency(row.vencido)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function MacroCard({ label, value }) {
  return (
    <div className="panel p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}
