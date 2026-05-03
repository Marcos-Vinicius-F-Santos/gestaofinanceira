import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { updateDocument } from './firestoreService';
import { requireOwnerId } from './accessScope';
import { getPayableStatus, getReceivableStatus } from '../utils/businessRules';

const requiredFields = ['tipo', 'descricao', 'valor', 'data', 'clienteFornecedor', 'categoria'];

export function validateLancamento(data) {
  const missing = requiredFields.filter((field) => data[field] === undefined || data[field] === null || data[field] === '');

  if (missing.length) {
    throw new Error('Preencha todos os campos obrigatorios.');
  }

  if (!['receita', 'despesa'].includes(data.tipo)) {
    throw new Error('Tipo de lancamento invalido.');
  }

  if (Number.isNaN(Number(data.valor)) || Number(data.valor) <= 0) {
    throw new Error('Informe um valor maior que zero.');
  }
}

function accountCollection(tipo) {
  return tipo === 'despesa' ? 'contas_pagar' : 'contas_receber';
}

function accountStatus(payload) {
  return payload.tipo === 'despesa' ? getPayableStatus(payload) : getReceivableStatus(payload);
}

function normalizeStatus(payload) {
  if (payload.tipo === 'despesa') {
    return payload.status === 'pago' ? 'pago' : getPayableStatus(payload);
  }

  return payload.status === 'recebido' ? 'recebido' : getReceivableStatus(payload);
}

function sanitizeLancamento(payload) {
  return {
    tipo: payload.tipo,
    descricao: payload.descricao.trim(),
    valor: Number(payload.valor),
    data: payload.data,
    clienteFornecedor: payload.clienteFornecedor.trim(),
    categoria: payload.categoria.trim(),
    status: normalizeStatus(payload),
  };
}

export async function createLancamento(payload, scope = {}) {
  validateLancamento(payload);

  const ownerId = requireOwnerId(scope);
  const data = { ...sanitizeLancamento(payload), userId: ownerId };

  const batch = writeBatch(db);
  const lancamentoRef = doc(collection(db, 'lancamentos'));
  const accountRef = doc(collection(db, accountCollection(data.tipo)));
  const now = serverTimestamp();
  const common = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  batch.set(lancamentoRef, {
    ...common,
    relatedAccountId: accountRef.id,
  });
  batch.set(accountRef, {
    ...common,
    lancamentoId: lancamentoRef.id,
  });

  await batch.commit();
  return lancamentoRef.id;
}

export async function updateLancamento(id, payload, previous) {
  validateLancamento(payload);

  const data = sanitizeLancamento(payload);

  const batch = writeBatch(db);
  const lancamentoRef = doc(db, 'lancamentos', id);
  const accountRef = previous?.relatedAccountId
    ? doc(db, accountCollection(previous.tipo), previous.relatedAccountId)
    : null;
  const targetAccountRef =
    previous?.relatedAccountId && previous.tipo === data.tipo
      ? accountRef
      : doc(collection(db, accountCollection(data.tipo)));
  const updatedPayload = {
    ...data,
    userId: previous?.userId,
    updatedAt: serverTimestamp(),
  };

  batch.update(lancamentoRef, {
    ...updatedPayload,
    relatedAccountId: targetAccountRef.id,
  });

  if (accountRef && previous.tipo !== data.tipo) {
    batch.delete(accountRef);
  }

  batch.set(
    targetAccountRef,
    {
      ...updatedPayload,
      lancamentoId: id,
      createdAt: previous?.createdAt || serverTimestamp(),
    },
    { merge: true },
  );

  await batch.commit();
}

export async function deleteLancamento(id, previous) {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'lancamentos', id));

  if (previous?.relatedAccountId) {
    batch.delete(doc(db, accountCollection(previous.tipo), previous.relatedAccountId));
  }

  await batch.commit();
}

export async function quitarConta(item) {
  await updateDocument('contas_pagar', item.id, { status: 'pago' });
  if (item.lancamentoId) {
    await updateDocument('lancamentos', item.lancamentoId, { status: 'pago' });
  }
}

export async function marcarRecebido(item) {
  await updateDocument('contas_receber', item.id, { status: 'recebido' });
  if (item.lancamentoId) {
    await updateDocument('lancamentos', item.lancamentoId, { status: 'recebido' });
  }
}
