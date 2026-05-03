import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizeCode(code) {
  return String(code || '').trim();
}

export async function requestPasswordResetCode(email) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    throw new Error('Informe o email.');
  }

  const callable = httpsCallable(functions, 'requestPasswordResetCode');
  await callable({ email: normalizedEmail });
  return { ok: true };
}

export async function verifyPasswordResetCode({ email, code, newPassword }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedCode = normalizeCode(code);

  if (!normalizedEmail) throw new Error('Informe o email.');
  if (!normalizedCode) throw new Error('Informe o codigo recebido.');
  if (!newPassword) throw new Error('Informe a nova senha.');
  if (newPassword.length < 8) throw new Error('A nova senha deve ter no minimo 8 caracteres.');

  try {
    const callable = httpsCallable(functions, 'verifyPasswordResetCode');
    await callable({ email: normalizedEmail, code: normalizedCode, newPassword });
    return { ok: true };
  } catch {
    throw new Error('Codigo invalido ou expirado.');
  }
}
