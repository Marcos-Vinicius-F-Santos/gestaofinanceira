import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import HomeRedirect from './components/routing/HomeRedirect';
import ProtectedRoute from './components/routing/ProtectedRoute';
import AdminPage from './pages/AdminPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import ContasPagarPage from './pages/ContasPagarPage';
import ContasReceberPage from './pages/ContasReceberPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import FornecedoresPage from './pages/FornecedoresPage';
import HistoricoPage from './pages/HistoricoPage';
import HistoricoPrecosPage from './pages/HistoricoPrecosPage';
import LoginPage from './pages/LoginPage';
import MovimentacaoPage from './pages/MovimentacaoPage';
import ParcelasPage from './pages/ParcelasPage';
import PlanoContasPage from './pages/PlanoContasPage';
import ProdutosPage from './pages/ProdutosPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/change-password', element: <ProtectedRoute><ChangePasswordPage /></ProtectedRoute> },
  {
    path: '/',
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <HomeRedirect /> },
      { path: 'produtos', element: <ProdutosPage /> },
      { path: 'fornecedores', element: <FornecedoresPage /> },
      { path: 'plano-contas', element: <PlanoContasPage /> },
      { path: 'contas', element: <Navigate to="/plano-contas" replace /> },
      { path: 'novo-lancamento', element: <MovimentacaoPage /> },
      { path: 'contas-pagar', element: <ContasPagarPage /> },
      { path: 'contas-receber', element: <ContasReceberPage /> },
      { path: 'historico', element: <HistoricoPage /> },
      { path: 'historico-precos', element: <HistoricoPrecosPage /> },
      { path: 'parcelas', element: <ParcelasPage /> },
      { path: 'admin', element: <AdminPage initialView="clientes" /> },
      { path: 'admin/clientes', element: <AdminPage initialView="clientes" /> },
      { path: 'admin/usuarios', element: <Navigate to="/admin/clientes" replace /> },
      { path: 'admin/dados', element: <Navigate to="/admin/clientes" replace /> },
      { path: 'admin/macro', element: <AdminPage initialView="macro" /> },
      { path: 'dashboard', element: <Navigate to="/produtos" replace /> },
      { path: 'lancamentos', element: <Navigate to="/novo-lancamento" replace /> },
      { path: 'estoque', element: <Navigate to="/novo-lancamento" replace /> },
      { path: 'relatorios', element: <Navigate to="/historico" replace /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
