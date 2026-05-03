import { LockKeyhole } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Alert from '../components/shared/Alert';
import Button from '../components/shared/Button';
import FormField from '../components/shared/FormField';

export default function LoginPage() {
  const { login, isAuthenticated, mustChangePassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const from = location.state?.from?.pathname || '/';

  if (isAuthenticated) {
    return <Navigate to={mustChangePassword ? '/change-password' : '/'} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(form.email, form.password);
      navigate(result.profile?.mustChangePassword ? '/change-password' : from, { replace: true });
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
          <div className="text-center">
            <Link to="/forgot-password" className="text-sm font-semibold text-blue-700 hover:text-blue-800">
              Esqueci minha senha
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
