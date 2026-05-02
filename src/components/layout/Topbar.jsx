import { useNavigate } from 'react-router-dom';
import { useAdminClient } from '../../contexts/AdminClientContext';
import { useAuth } from '../../contexts/AuthContext';
import { isFirebaseConfigured } from '../../services/firebase';

export default function Topbar() {
  const { profile, role } = useAuth();
  const { selectedClient, isViewingClient, clearSelectedClient } = useAdminClient();
  const navigate = useNavigate();
  const displayName = profile?.nome || profile?.name || profile?.email || 'Usuario';
  const backToAdmin = () => {
    clearSelectedClient();
    navigate('/admin/clientes');
  };

  return (
    <div className="flex flex-1 items-center justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink">Controle economico-financeiro</p>
        <div className="hidden items-center gap-2 sm:flex">
          <p className="text-xs text-slate-500">
            {isViewingClient ? `Visualizando cliente: ${selectedClient?.nome || selectedClient?.email}` : 'Produtos, fornecedores, movimentacoes e parcelas'}
          </p>
          {!isFirebaseConfigured ? (
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-blue-700">
              Demo
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {isViewingClient ? (
          <button type="button" className="btn-secondary hidden sm:inline-flex" onClick={backToAdmin}>
            Voltar para Admin
          </button>
        ) : null}
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-700">{displayName}</p>
          <p className="text-xs font-bold uppercase tracking-wide text-blue-600">{role}</p>
        </div>
        <div className="grid h-9 w-9 place-items-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 ring-2 ring-white sm:h-10 sm:w-10">
          {displayName.slice(0, 1).toUpperCase()}
        </div>
      </div>
    </div>
  );
}
