import { Download, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import SupplierForm from '../components/suppliers/SupplierForm';
import Alert from '../components/shared/Alert';
import EmptyState from '../components/shared/EmptyState';
import LoadingState from '../components/shared/LoadingState';
import Modal from '../components/shared/Modal';
import PageHeader from '../components/shared/PageHeader';
import StatusBadge from '../components/shared/StatusBadge';
import { useDataScope } from '../hooks/useDataScope';
import { createFornecedor, getFornecedores, inativarFornecedor, updateFornecedor } from '../services/fornecedorService';
import { exportToCSV } from '../utils/csv';

export default function FornecedoresPage() {
  const scope = useDataScope();
  const [suppliers, setSuppliers] = useState([]);
  const [currentSupplier, setCurrentSupplier] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [actionError, setActionError] = useState('');

  const loadSuppliers = useCallback(async () => {
    if (!scope.effectiveUserId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setActionError('');

    try {
      setSuppliers(await getFornecedores(scope));
    } catch (err) {
      setActionError(err.message || 'Nao foi possivel carregar fornecedores.');
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const closeModal = () => {
    setModalOpen(false);
    setCurrentSupplier(null);
  };

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    setFeedback('');
    setActionError('');

    try {
      if (currentSupplier) {
        await updateFornecedor(currentSupplier.id, payload, scope);
        setFeedback('Fornecedor atualizado com sucesso.');
      } else {
        await createFornecedor(payload, scope);
        setFeedback('Fornecedor cadastrado com sucesso.');
      }
      closeModal();
      await loadSuppliers();
    } catch (err) {
      setActionError(err.message || 'Nao foi possivel salvar o fornecedor.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInactivate = async (id) => {
    setFeedback('');
    setActionError('');

    try {
      await inativarFornecedor(id);
      setFeedback('Fornecedor inativado.');
      await loadSuppliers();
    } catch (err) {
      setActionError(err.message || 'Nao foi possivel inativar o fornecedor.');
    }
  };

  const exportSuppliers = () => {
    exportToCSV(
      'fornecedores.csv',
      suppliers.map((supplier) => ({
        nomeFantasia: supplier.nomeFantasia,
        razaoSocial: supplier.razaoSocial,
        cnpj: supplier.cnpj,
        inscricaoEstadual: supplier.inscricaoEstadual,
        telefone: supplier.telefone,
        email: supplier.email,
        endereco: supplier.endereco,
        descontoPadrao: supplier.descontoPadrao,
        ativo: supplier.ativo ? 'sim' : 'nao',
      })),
      ['nomeFantasia', 'razaoSocial', 'cnpj', 'inscricaoEstadual', 'telefone', 'email', 'endereco', 'descontoPadrao', 'ativo'],
    );
  };

  if (loading) return <LoadingState label="Carregando fornecedores..." />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Fornecedores"
        description="Mantenha os fornecedores para vincular compras, despesas e historico de preco."
        action={
          <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-2">
            <button type="button" className="btn-primary w-full" onClick={() => { setCurrentSupplier(null); setModalOpen(true); }}>
              <Plus className="h-4 w-4" />
              Novo Fornecedor
            </button>
            <button type="button" className="btn-secondary w-full" onClick={exportSuppliers}>
              <Download className="h-4 w-4" />
              Exportar
            </button>
          </div>
        }
      />
      <Alert variant="error">{actionError}</Alert>
      <Alert variant="success">{feedback}</Alert>

      {!suppliers.length ? (
        <EmptyState title="Nenhum fornecedor cadastrado" description="Cadastre pelo menos um fornecedor para registrar movimentacoes." />
      ) : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {['Fornecedor', 'CNPJ', 'Contato', 'Desconto', 'Status', 'Acoes'].map((label) => (
                    <th key={label} className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {suppliers.map((supplier, index) => (
                  <tr key={supplier.id} className={`${index % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'} transition hover:bg-blue-50/60`}>
                    <td className="min-w-56 px-4 py-3.5">
                      <p className="text-sm font-bold text-slate-900">{supplier.nomeFantasia}</p>
                      <p className="text-xs text-slate-500">{supplier.razaoSocial || '-'}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">{supplier.cnpj || '-'}</td>
                    <td className="min-w-52 px-4 py-3.5 text-sm text-slate-600">
                      <p>{supplier.telefone || '-'}</p>
                      <p className="text-xs">{supplier.email || '-'}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">{supplier.descontoPadrao === '' ? '-' : `${supplier.descontoPadrao}%`}</td>
                    <td className="whitespace-nowrap px-4 py-3.5"><StatusBadge value={supplier.ativo ? 'ativo' : 'inativo'} /></td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <div className="flex gap-2">
                        <button type="button" className="table-action" onClick={() => { setCurrentSupplier(supplier); setModalOpen(true); }} aria-label="Editar fornecedor">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button type="button" className="table-action text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700" onClick={() => handleInactivate(supplier.id)} aria-label="Inativar fornecedor">
                          <Trash2 className="h-4 w-4" />
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

      {modalOpen ? (
        <Modal
          title={currentSupplier ? 'Editar fornecedor' : 'Novo fornecedor'}
          description="Preencha os dados cadastrais do fornecedor."
          onClose={closeModal}
        >
          <SupplierForm currentSupplier={currentSupplier} onSubmit={handleSubmit} onCancel={closeModal} submitting={submitting} />
        </Modal>
      ) : null}
    </div>
  );
}
