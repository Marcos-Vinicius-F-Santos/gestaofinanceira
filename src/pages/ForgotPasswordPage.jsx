import { sendPasswordResetEmail } from 'firebase/auth';
import { ArrowLeft, Mail } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Alert from '../components/shared/Alert';
import Button from '../components/shared/Button';
import FormField from '../components/shared/FormField';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../services/firebase';

const successMessage = 'Se este email estiver cadastrado, enviaremos um link para redefinir sua senha.';

export default function ForgotPasswordPage() {
  const { isAuthenticated, mustChangePassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate to={mustChangePassword ? '/change-password' : '/'} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      setMessage(successMessage);
    } catch (err) {
      if (err.code === 'auth/invalid-email') {
        setError('Informe um email valido.');
      } else {
        setMessage(successMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-8">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <div className="mb-6">
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-blue-100 text-blue-700">
            <Mail className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-ink">Recuperar senha</h1>
          <p className="mt-1 text-sm text-slate-500">
            Informe seu email para receber um link seguro de redefinicao de senha.
          </p>
        </div>

        <div className="mb-4 space-y-2">
          <Alert variant="success">{message}</Alert>
          <Alert variant="error">{error}</Alert>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField id="email" label="Email">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </FormField>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar link de recuperacao'}
          </Button>
        </form>

        <Link to="/login" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800">
          <ArrowLeft className="h-4 w-4" />
          Voltar para login
        </Link>
      </section>
    </main>
  );
}
