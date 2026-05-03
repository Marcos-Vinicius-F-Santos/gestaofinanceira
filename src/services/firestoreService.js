import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

const USER_SCOPED_COLLECTIONS = new Set([
  'produtos',
  'fornecedores',
  'contas',
  'subcontas',
  'movimentacoes',
  'parcelas',
  'lancamentos',
  'contas_pagar',
  'contas_receber',
  'estoque',
]);

function normalizeSnapshot(snapshot) {
  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}

function assertUserIdOnCreate(collectionName, data) {
  if (USER_SCOPED_COLLECTIONS.has(collectionName) && !data?.userId) {
    throw new Error(`userId obrigatorio para criar documentos em ${collectionName}.`);
  }
}

export async function listDocuments(collectionName, constraints = []) {
  const ref = collection(db, collectionName);
  const q = query(ref, ...constraints);
  const snapshot = await getDocs(q);
  return normalizeSnapshot(snapshot);
}

export function subscribeToCollection(collectionName, constraints = [], onData, onError) {
  const ref = collection(db, collectionName);
  const q = query(ref, ...constraints);

  return onSnapshot(
    q,
    (snapshot) => {
      onData(normalizeSnapshot(snapshot));
    },
    (error) => onError?.(error),
  );
}

export async function listRecentDocuments(collectionName, limitConstraint) {
  const ref = collection(db, collectionName);
  const constraints = limitConstraint
    ? [orderBy('createdAt', 'desc'), limitConstraint]
    : [orderBy('createdAt', 'desc')];
  const snapshot = await getDocs(query(ref, ...constraints));
  return normalizeSnapshot(snapshot);
}

export async function createDocument(collectionName, data) {
  assertUserIdOnCreate(collectionName, data);

  const ref = collection(db, collectionName);
  const payload = {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const created = await addDoc(ref, payload);
  return created.id;
}

export async function updateDocument(collectionName, id, data) {
  const ref = doc(db, collectionName, id);
  return updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDocument(collectionName, id) {
  return deleteDoc(doc(db, collectionName, id));
}

export const getAll = listDocuments;
export const create = createDocument;
export const update = updateDocument;
export const remove = deleteDocument;

export function byField(field, operator, value) {
  return where(field, operator, value);
}

export function byCreatedDesc() {
  return orderBy('createdAt', 'desc');
}

export function byDataDesc() {
  return orderBy('data', 'desc');
}
