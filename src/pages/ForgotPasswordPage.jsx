import { ArrowLeft, KeyRound, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Alert from '../components/shared/Alert';
import Button from '../components/shared/Button';
import FormField from '../components/shared/FormField';
import { useAuth } from '../contexts/AuthContext';
import {
  requestPasswordResetCode,
  verifyPasswordResetCode,
} from '../services/passwordResetService';

const initialForm = {
  email: '',
  code: '',
  newPassword: '',
  confirmPassword: '',
};

export default function ForgotPasswordPage() {
  const { isAuthenticated, mustChangePassword } = useAuth();
  const [step, setStep] = useState('email');
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = window.setInterval(() => {
      setCooldown((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldown]);

  if (isAuthenticated) {
    return <Navigate to={mustChangePassword ? '/change-password' : '/'} replace />;
  }

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleRequestCode = async (event) => {
    event?.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await requestPasswordResetCode(form.email);
      setStep('verify');
      setCooldown(60);
      setMessage('Se este email estiver cadastrado, enviaremos um codigo de recuperacao. Verifique seu email.');
    } catch (err) {
      setError(err.message || 'Nao foi possivel solicitar a recuperacao agora.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (form.newPassword !== form.confirmPassword) {
      setError('A confirmacao deve ser igual a nova senha.');
      setLoading(false);
      return;
    }

    try {
      await verifyPasswordResetCode({
        email: form.email,
        code: form.code,
        newPassword: form.newPassword,
      });
      setStep('success');
      setMessage('Senha alterada com sucesso. Faca login novamente.');
      setForm(initialForm);
    } catch (err) {
      setError(err.message || 'Codigo invalido ou expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-8">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <div className="mb-6">
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-blue-100 text-blue-700">
            {step === 'email' ? <Mail className="h-6 w-6" /> : <KeyRound className="h-6 w-6" />}
          </div>
          <h1 className="text-2xl font-bold text-ink">Recuperar senha</h1>
          <p className="mt-1 text-sm text-slate-500">
            Informe seu email e valide o codigo recebido para criar uma nova senha.
          </p>
        </div>

        <div className="mb-4 space-y-2">
          <Alert variant="success">{message}</Alert>
          <Alert variant="error">{error}</Alert>
        </div>

        {step === 'email' ? (
          <form className="space-y-4" onSubmit={handleRequestCode}>
            <FormField id="email" label="Email">
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) => updateForm('email', event.target.value)}
                required
              />
            </FormField>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar codigo'}
            </Button>
          </form>
        ) : null}

        {step === 'verify' ? (
          <form className="space-y-4" onSubmit={handleVerifyCode}>
            <FormField id="reset-email" label="Email">
              <input
                id="reset-email"
                type="email"
                value={form.email}
                onChange={(event) => updateForm('email', event.target.value)}
                required
              />
            </FormField>
            <FormField id="code" label="Codigo recebido">
              <input
                id="code"
                type="text"
                inputMode="numeric"
                maxLength="6"
                value={form.code}
                onChange={(event) => updateForm('code', event.target.value.replace(/\D/g, ''))}
                required
              />
            </FormField>
            <FormField id="newPassword" label="Nova senha">
              <input
                id="newPassword"
                type="password"
                minLength="8"
                value={form.newPassword}
                onChange={(event) => updateForm('newPassword', event.target.value)}
                required
              />
            </FormField>
            <FormField id="confirmPassword" label="Confirmar nova senha">
              <input
                id="confirmPassword"
                type="password"
                minLength="8"
                value={form.confirmPassword}
                onChange={(event) => updateForm('confirmPassword', event.target.value)}
                required
              />
            </FormField>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Alterando...' : 'Alterar senha'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={handleRequestCode}
              disabled={loading || cooldown > 0}
            >
              {cooldown > 0 ? `Reenviar codigo (${cooldown}s)` : 'Reenviar codigo'}
            </Button>
          </form>
        ) : null}

        {step === 'success' ? (
          <div className="space-y-4">
            <Link
              to="/login"
              className="btn-primary w-full"
            >
              Voltar para login
            </Link>
          </div>
        ) : null}

        <Link to="/login" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800">
          <ArrowLeft className="h-4 w-4" />
          Voltar para login
        </Link>
      </section>
    </main>
  );
}
