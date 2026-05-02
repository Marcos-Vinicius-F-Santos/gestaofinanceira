import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';
import {
  mockGetUserProfile,
  mockLogin,
  mockLogout,
  mockRegisterUser,
  mockSubscribeAuthState,
} from './mockService';

export async function login(email, password) {
  const result = !isFirebaseConfigured
    ? await mockLogin(email, password)
    : await signInWithEmailAndPassword(auth, email, password).then(async (credential) => ({
        user: credential.user,
        profile: await getUserProfile(credential.user.uid),
      }));
  const { user, profile } = result;

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

  if (isFirebaseConfigured) {
    await updateDoc(doc(db, 'users', user.uid), { lastLoginAt: serverTimestamp(), updatedAt: serverTimestamp() });
  }

  return { user, profile };
}

export async function registerUser({ email, password, name, role = 'client' }) {
  if (!isFirebaseConfigured) {
    return mockRegisterUser({ email, password, name, role });
  }

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
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastLoginAt: null,
  };

  await setDoc(userRef, payload);
  return payload;
}

export function logout() {
  if (!isFirebaseConfigured) {
    return mockLogout();
  }

  return signOut(auth);
}

export async function getUserProfile(uid) {
  if (!uid) return null;

  if (!isFirebaseConfigured) {
    return mockGetUserProfile(uid);
  }

  const snapshot = await getDoc(doc(db, 'users', uid));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return {
    id: snapshot.id,
    ...data,
    role: data.role === 'user' ? 'client' : data.role,
    status: data.status || (data.ativo === false ? 'blocked' : 'active'),
  };
}

export function subscribeAuthState(callback) {
  if (!isFirebaseConfigured) {
    return mockSubscribeAuthState(callback);
  }

  return onAuthStateChanged(auth, callback);
}
