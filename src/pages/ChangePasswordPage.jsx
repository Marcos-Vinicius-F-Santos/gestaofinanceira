import { LockKeyhole } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from '../components/shared/Alert';
import Button from '../components/shared/Button';
import FormField from '../components/shared/FormField';
import { useAuth } from '../contexts/AuthContext';

const initialForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

function friendlyPasswordError(error) {
  const code = error?.code || '';

  if (code.includes('wrong-password') || code.includes('invalid-credential')) {
    return 'Senha atual incorreta.';
  }

  if (code.includes('weak-password')) {
    return 'A nova senha e muito fraca. Use pelo menos 8 caracteres.';
  }

  if (code.includes('requires-recent-login') || code.includes('user-token-expired')) {
    return 'Sessao expirada. Faca login novamente.';
  }

  return error?.message || 'Nao foi possivel alterar a senha.';
}

export default function ChangePasswordPage() {
  const { changePassword, logout, mustChangePassword } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState('');
  const [actionError, setActionError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    const nextErrors = {};

    if (!form.currentPassword) nextErrors.currentPassword = 'Informe a senha atual.';
    if (!form.newPassword) nextErrors.newPassword = 'Informe a nova senha.';
    if (!form.confirmPassword) nextErrors.confirmPassword = 'Confirme a nova senha.';
    if (form.newPassword && form.newPassword.length < 8) nextErrors.newPassword = 'A nova senha deve ter no minimo 8 caracteres.';
    if (form.currentPassword && form.newPassword && form.currentPassword === form.newPassword) {
      nextErrors.newPassword = 'A nova senha deve ser diferente da senha atual.';
    }
    if (form.newPassword && form.confirmPassword && form.newPassword !== form.confirmPassword) {
      nextErrors.confirmPassword = 'A confirmacao deve ser igual a nova senha.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback('');
    setActionError('');

    if (!validate()) return;

    setSubmitting(true);

    try {
      await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm(initialForm);
      setFeedback('Senha alterada com sucesso. Redirecionando...');
      window.setTimeout(() => navigate('/', { replace: true }), 900);
    } catch (err) {
      setActionError(friendlyPasswordError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-8">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <div className="mb-6">
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-blue-100 text-blue-700">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-ink">Alterar senha</h1>
          <p className="mt-1 text-sm text-slate-500">
            {mustChangePassword
              ? 'Por seguranca, altere sua senha temporaria antes de continuar.'
              : 'Atualize sua senha de acesso com seguranca.'}
          </p>
        </div>

        <div className="mb-4 space-y-2">
          <Alert variant="error">{actionError}</Alert>
          <Alert variant="success">{feedback}</Alert>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField id="currentPassword" label="Senha atual" error={errors.currentPassword}>
            <input
              id="currentPassword"
              type="password"
              value={form.currentPassword}
              onChange={(event) => update('currentPassword', event.target.value)}
              autoComplete="current-password"
              required
            />
          </FormField>
          <FormField id="newPassword" label="Nova senha" error={errors.newPassword}>
            <input
              id="newPassword"
              type="password"
              value={form.newPassword}
              onChange={(event) => update('newPassword', event.target.value)}
              autoComplete="new-password"
              required
            />
          </FormField>
          <FormField id="confirmPassword" label="Confirmar nova senha" error={errors.confirmPassword}>
            <input
              id="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={(event) => update('confirmPassword', event.target.value)}
              autoComplete="new-password"
              required
            />
          </FormField>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Alterando...' : 'Alterar senha'}
          </Button>
        </form>

        <button type="button" className="mt-4 w-full text-sm font-semibold text-slate-500 hover:text-slate-800" onClick={handleLogout}>
          Sair e voltar ao login
        </button>
      </section>
    </main>
  );
}
