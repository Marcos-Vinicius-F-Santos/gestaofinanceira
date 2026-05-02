import { Download } from 'lucide-react';
import { useMemo, useState } from 'react';
import FiltersBar from '../components/finance/FiltersBar';
import LancamentoForm from '../components/finance/LancamentoForm';
import LancamentosTable from '../components/finance/LancamentosTable';
import Alert from '../components/shared/Alert';
import LoadingState from '../components/shared/LoadingState';
import PageHeader from '../components/shared/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { createLancamento, deleteLancamento, updateLancamento } from '../services/lancamentoService';
import { exportToCSV } from '../utils/csv';
import { normalizeLancamento } from '../utils/businessRules';
import { applyLancamentoFilters, emptyFilters, sortByDateDesc } from '../utils/filters';

export default function LancamentosPage() {
  const { isAdmin } = useAuth();
  const { items, loading, error } = useFirestoreCollection('lancamentos');
  const [filters, setFilters] = useState(emptyFilters);
  const [currentItem, setCurrentItem] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const normalizedItems = useMemo(() => items.map(normalizeLancamento), [items]);
  const filteredItems = useMemo(() => sortByDateDesc(applyLancamentoFilters(normalizedItems, filters)), [normalizedItems, filters]);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    setFeedback('');

    try {
      if (currentItem) {
        await updateLancamento(currentItem.id, payload, currentItem);
        setCurrentItem(null);
        setFeedback('Lancamento atualizado com sucesso.');
      } else {
        await createLancamento(payload);
        setFeedback('Lancamento criado com sucesso.');
      }
    } catch (err) {
      setFeedback(err.message || 'Nao foi possivel salvar.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const item = normalizedItems.find((entry) => entry.id === id);
    await deleteLancamento(id, item);
    setFeedback('Lancamento excluido.');
  };

  if (loading) return <LoadingState label="Carregando lancamentos..." />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Lancamentos"
        description="Cadastre receitas, despesas e acompanhe seus status."
        action={
          <button type="button" className="btn-secondary w-full sm:w-auto" onClick={() => exportToCSV('lancamentos.csv', filteredItems)}>
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
        }
      />

      <Alert variant="error">{error}</Alert>
      <Alert variant="success">{feedback}</Alert>

      {isAdmin ? (
        <LancamentoForm currentItem={currentItem} onSubmit={handleSubmit} onCancel={() => setCurrentItem(null)} submitting={submitting} />
      ) : null}

      <FiltersBar filters={filters} onChange={setFilters} />
      <LancamentosTable
        items={filteredItems}
        onEdit={isAdmin ? setCurrentItem : null}
        onDelete={isAdmin ? handleDelete : null}
      />
    </div>
  );
}
