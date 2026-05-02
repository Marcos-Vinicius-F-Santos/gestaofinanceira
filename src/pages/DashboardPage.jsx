import { ArrowDownCircle, ArrowUpCircle, ListChecks, Wallet } from 'lucide-react';
import FinanceChart from '../components/dashboard/FinanceChart';
import StatCard from '../components/dashboard/StatCard';
import LancamentosTable from '../components/finance/LancamentosTable';
import Alert from '../components/shared/Alert';
import LoadingState from '../components/shared/LoadingState';
import PageHeader from '../components/shared/PageHeader';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { normalizeLancamento } from '../utils/businessRules';
import { formatCurrency } from '../utils/formatters';

export default function DashboardPage() {
  const { items, loading, error } = useFirestoreCollection('lancamentos');

  const normalizedItems = items.map(normalizeLancamento);
  const totalReceber = normalizedItems.filter((item) => item.tipo === 'receita' && item.status === 'aberto').reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const totalPagar = normalizedItems.filter((item) => item.tipo === 'despesa' && item.status === 'aberto').reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const receitas = normalizedItems.filter((item) => item.tipo === 'receita').reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const despesas = normalizedItems.filter((item) => item.tipo === 'despesa').reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const saldo = receitas - despesas;
  const recentItems = [...normalizedItems].sort((a, b) => String(b.data || '').localeCompare(String(a.data || ''))).slice(0, 5);
  const chartData = [
    { name: 'Receitas', valor: receitas },
    { name: 'Despesas', valor: despesas },
  ];

  if (loading) return <LoadingState label="Carregando dashboard..." />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader title="Dashboard" description="Visao geral do financeiro do negocio." />
      <Alert variant="error">{error}</Alert>

      <section className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <StatCard title="Total a pagar" value={formatCurrency(totalPagar)} tone="negative" icon={ArrowDownCircle} />
        <StatCard title="Total a receber" value={formatCurrency(totalReceber)} tone="positive" icon={ArrowUpCircle} />
        <StatCard title="Saldo" value={formatCurrency(saldo)} helper="Receitas menos despesas" icon={Wallet} />
        <StatCard title="Lancamentos" value={items.length} helper="Registros cadastrados" icon={ListChecks} />
      </section>

      <section className="grid gap-4 sm:gap-6 xl:grid-cols-[1fr_1.2fr]">
        <FinanceChart data={chartData} />
        <div>
          <div className="mb-3 px-1">
            <h2 className="text-base font-bold text-ink sm:text-lg">Ultimos lancamentos</h2>
            <p className="text-sm text-slate-500">Os registros mais recentes aparecem primeiro.</p>
          </div>
          <LancamentosTable items={recentItems} />
        </div>
      </section>
    </div>
  );
}
