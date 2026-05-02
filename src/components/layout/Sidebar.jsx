import { BarChart3, ClipboardList, CreditCard, History, ListTree, LogOut, Package, ReceiptText, Store, Tags, Users, WalletCards, X } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminClient } from '../../contexts/AdminClientContext';
import { useAuth } from '../../contexts/AuthContext';

const userNavItems = [
  { to: '/produtos', label: 'Produtos', icon: Package },
  { to: '/fornecedores', label: 'Fornecedores', icon: Store },
  { to: '/plano-contas', label: 'Plano de Contas', icon: ListTree },
  { to: '/novo-lancamento', label: 'Novo Lancamento', icon: ReceiptText },
  { to: '/contas-pagar', label: 'Contas a Pagar', icon: CreditCard },
  { to: '/contas-receber', label: 'Contas a Receber', icon: WalletCards },
  { to: '/historico', label: 'Historico', icon: History },
  { to: '/historico-precos', label: 'Historico de Precos', icon: Tags },
  { to: '/parcelas', label: 'Parcelas', icon: ClipboardList },
];

const adminNavItems = [
  { to: '/admin/clientes', label: 'Clientes', icon: Users },
  { to: '/admin/macro', label: 'Visao Macro', icon: BarChart3 },
];

export default function Sidebar({ open, onClose }) {
  const { logout, isAdmin } = useAuth();
  const { isViewingClient, clearSelectedClient } = useAdminClient();
  const navigate = useNavigate();
  const navItems = isAdmin && !isViewingClient ? adminNavItems : userNavItems;
  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };
  const backToAdmin = () => {
    clearSelectedClient();
    navigate('/admin/clientes');
    onClose?.();
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-900/40 transition lg:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[min(18rem,calc(100vw-2rem))] flex-col border-r border-slate-200 bg-white shadow-xl shadow-slate-900/5 transition-transform lg:w-72 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4 sm:h-16 sm:px-5">
          <div>
            <p className="text-lg font-bold tracking-tight text-ink">Gestao Pro</p>
            <p className="text-xs font-medium text-slate-500">{isAdmin && !isViewingClient ? 'Administracao' : 'Controle economico'}</p>
          </div>
          <button type="button" className="table-action lg:hidden" onClick={onClose} aria-label="Fechar menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4 sm:py-5">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition ${
                  isActive ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-ink'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-4">
          {isAdmin && isViewingClient ? (
            <button type="button" className="btn-secondary mb-2 w-full" onClick={backToAdmin}>
              Voltar para Admin
            </button>
          ) : null}
          <button type="button" className="btn-secondary w-full" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
