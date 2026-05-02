import { byField, createDocument, listDocuments, updateDocument } from './firestoreService';
import { filterByScope, getTargetUserId, requireOwnerId } from './accessScope';

const CONTAS_COLLECTION = 'contas';
const SUBCONTAS_COLLECTION = 'subcontas';

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeConta(item) {
  return {
    ...item,
    nome: normalizeText(item.nome),
    tipo: item.tipo === 'receita' ? 'receita' : 'despesa',
    ativo: item.ativo !== false,
  };
}

function normalizeSubconta(item) {
  return {
    ...item,
    nome: normalizeText(item.nome),
    ativo: item.ativo !== false,
  };
}

function scopedConstraints(scope = {}) {
  const targetUserId = getTargetUserId(scope);
  return targetUserId ? [byField('userId', '==', targetUserId)] : [];
}

export async function getContas(scope = {}) {
  const items = await listDocuments(CONTAS_COLLECTION, scopedConstraints(scope));
  return filterByScope(items, scope)
    .map(normalizeConta)
    .sort((a, b) => a.tipo.localeCompare(b.tipo) || a.nome.localeCompare(b.nome));
}

export async function getSubcontas(scope = {}, contaId = '') {
  const constraints = scopedConstraints(scope);
  const selectedContaId = normalizeText(contaId);

  if (selectedContaId) {
    constraints.push(byField('contaId', '==', selectedContaId));
  }

  const items = await listDocuments(SUBCONTAS_COLLECTION, constraints);
  return filterByScope(items, scope)
    .map(normalizeSubconta)
    .filter((item) => !selectedContaId || item.contaId === selectedContaId)
    .sort((a, b) => a.nome.localeCompare(b.nome));
}

export async function createConta(payload, scope = {}) {
  const ownerId = requireOwnerId(scope);
  const nome = normalizeText(payload.nome);
  const tipo = payload.tipo;

  if (!nome) throw new Error('Informe o nome da conta.');
  if (!['despesa', 'receita'].includes(tipo)) throw new Error('Tipo de conta invalido.');

  return createDocument(CONTAS_COLLECTION, {
    userId: ownerId,
    nome,
    tipo,
    ativo: payload.ativo !== false,
  });
}

export async function updateConta(id, payload) {
  const nome = normalizeText(payload.nome);
  const tipo = payload.tipo;

  if (!nome) throw new Error('Informe o nome da conta.');
  if (!['despesa', 'receita'].includes(tipo)) throw new Error('Tipo de conta invalido.');

  return updateDocument(CONTAS_COLLECTION, id, {
    nome,
    tipo,
    ativo: payload.ativo !== false,
  });
}

export async function inativarConta(id) {
  return updateDocument(CONTAS_COLLECTION, id, { ativo: false });
}

export async function createSubconta(payload, scope = {}) {
  const ownerId = requireOwnerId(scope);
  const nome = normalizeText(payload.nome);
  const contaId = normalizeText(payload.contaId);

  if (!contaId) throw new Error('Selecione a conta vinculada.');
  if (!nome) throw new Error('Informe o nome da subconta.');

  return createDocument(SUBCONTAS_COLLECTION, {
    userId: ownerId,
    contaId,
    nome,
    ativo: payload.ativo !== false,
  });
}

export async function updateSubconta(id, payload) {
  const nome = normalizeText(payload.nome);

  if (!nome) throw new Error('Informe o nome da subconta.');

  return updateDocument(SUBCONTAS_COLLECTION, id, {
    nome,
    ativo: payload.ativo !== false,
  });
}

export async function inativarSubconta(id) {
  return updateDocument(SUBCONTAS_COLLECTION, id, { ativo: false });
}
