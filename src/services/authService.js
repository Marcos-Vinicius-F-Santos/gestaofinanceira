import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export async function login(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const user = credential.user;
  const profile = await getUserProfile(user.uid);

  if (!profile) {
    await logout();
    throw new Error('Perfil de usuario nao encontrado.');
  }

  if (profile.role !== 'admin' && profile.status !== 'active') {
    await logout();
    if (profile.status === 'blocked') {
      throw new Error('Seu acesso foi bloqueado. Entre em contato com o administrador.');
    }
    throw new Error('Seu acesso ainda nao foi liberado pelo administrador.');
  }

  await updateDoc(doc(db, 'users', user.uid), { lastLoginAt: serverTimestamp(), updatedAt: serverTimestamp() });

  return { user, profile };
}

export async function registerUser({ email, password, name, role = 'client' }) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const userRef = doc(db, 'users', credential.user.uid);
  const payload = {
    uid: credential.user.uid,
    email,
    nome: name,
    name,
    role,
    status: 'active',
    ativo: true,
    mustChangePassword: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    firstLoginAt: null,
    lastLoginAt: null,
    passwordChangedAt: null,
  };

  await setDoc(userRef, payload);
  return payload;
}

export async function changePassword({ currentPassword, newPassword }) {
  if (!currentPassword) throw new Error('Informe a senha atual.');
  if (!newPassword) throw new Error('Informe a nova senha.');
  if (newPassword.length < 8) throw new Error('A nova senha deve ter no minimo 8 caracteres.');
  if (currentPassword === newPassword) throw new Error('A nova senha deve ser diferente da senha atual.');

  const currentUser = auth.currentUser;

  if (!currentUser?.email) {
    throw new Error('Sessao expirada. Faca login novamente.');
  }

  const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
  await reauthenticateWithCredential(currentUser, credential);
  await updatePassword(currentUser, newPassword);

  const profile = await getUserProfile(currentUser.uid);
  const payload = {
    mustChangePassword: false,
    passwordChangedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (!profile?.firstLoginAt) {
    payload.firstLoginAt = serverTimestamp();
  }

  await updateDoc(doc(db, 'users', currentUser.uid), payload);
  return getUserProfile(currentUser.uid);
}

export function logout() {
  return signOut(auth);
}

export async function getUserProfile(uid) {
  if (!uid) return null;

  const snapshot = await getDoc(doc(db, 'users', uid));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return {
    id: snapshot.id,
    ...data,
    role: data.role === 'user' ? 'client' : data.role,
    status: data.status || (data.ativo === false ? 'blocked' : 'active'),
    mustChangePassword: Boolean(data.mustChangePassword),
  };
}

export function subscribeAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}
