import { LockKeyhole } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Alert from '../components/shared/Alert';
import Button from '../components/shared/Button';
import FormField from '../components/shared/FormField';
import { isFirebaseConfigured } from '../services/firebase';
import { demoCredentials } from '../services/mockService';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const from = location.state?.from?.pathname || '/';

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Nao foi possivel entrar.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (credentials) => {
    setForm(credentials);
    setLoading(true);
    setError('');

    try {
      await login(credentials.email, credentials.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Nao foi possivel entrar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-8">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <div className="mb-6">
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-blue-100 text-blue-700">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-ink">Entrar no Gestao Pro</h1>
          <p className="mt-1 text-sm text-slate-500">Acesse produtos, fornecedores, movimentacoes e parcelas.</p>
        </div>

        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField id="email" label="Email">
            <input id="email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          </FormField>
          <FormField id="password" label="Senha">
            <input id="password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
          </FormField>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        {!isFirebaseConfigured ? (
          <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-bold text-blue-800">Modo demo ativo</p>
            <p className="mt-1 text-sm leading-5 text-blue-700">
              Use os acessos de teste para navegar sem configurar Firebase.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Button variant="secondary" className="bg-white" onClick={() => quickLogin(demoCredentials.admin)} disabled={loading}>
                Admin demo
              </Button>
              <Button variant="secondary" className="bg-white" onClick={() => quickLogin(demoCredentials.user)} disabled={loading}>
                Usuario demo
              </Button>
            </div>
            <div className="mt-3 rounded-md bg-white px-3 py-2 font-mono text-xs text-slate-600">
              admin@teste.com / 123456<br />
              cliente@teste.com / 123456
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
