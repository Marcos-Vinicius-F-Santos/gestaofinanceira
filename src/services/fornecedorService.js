import { byField, createDocument, listDocuments, updateDocument } from './firestoreService';
import { filterByScope, getTargetUserId, requireOwnerId } from './accessScope';

const COLLECTION = 'fornecedores';

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeCnpj(value) {
  return String(value || '').replace(/\D/g, '');
}

function normalizeFornecedor(item) {
  return {
    ...item,
    nomeFantasia: normalizeText(item.nomeFantasia),
    razaoSocial: normalizeText(item.razaoSocial),
    cnpj: normalizeCnpj(item.cnpj),
    inscricaoEstadual: normalizeText(item.inscricaoEstadual),
    telefone: normalizeText(item.telefone),
    email: normalizeText(item.email),
    endereco: normalizeText(item.endereco),
    descontoPadrao: item.descontoPadrao === '' || item.descontoPadrao === undefined || item.descontoPadrao === null
      ? ''
      : Number(item.descontoPadrao),
    ativo: item.ativo !== false,
  };
}

function sanitizeFornecedor(payload, { forCreate = false, ownerId = '' } = {}) {
  const nomeFantasia = normalizeText(payload.nomeFantasia);
  const descontoPadrao = payload.descontoPadrao === '' || payload.descontoPadrao === undefined || payload.descontoPadrao === null
    ? ''
    : Number(payload.descontoPadrao);

  if (!nomeFantasia) {
    throw new Error('Informe o nome fantasia do fornecedor.');
  }

  if (descontoPadrao !== '' && Number.isNaN(descontoPadrao)) {
    throw new Error('Desconto padrao deve ser numerico.');
  }

  const data = {
    nomeFantasia,
    razaoSocial: normalizeText(payload.razaoSocial),
    cnpj: normalizeCnpj(payload.cnpj),
    inscricaoEstadual: normalizeText(payload.inscricaoEstadual),
    telefone: normalizeText(payload.telefone),
    email: normalizeText(payload.email),
    endereco: normalizeText(payload.endereco),
    descontoPadrao,
    ativo: payload.ativo !== false,
  };

  if (forCreate) {
    data.userId = ownerId;
  }

  return data;
}

async function listFornecedoresRaw(scope = {}) {
  const targetUserId = getTargetUserId(scope);
  const constraints = targetUserId ? [byField('userId', '==', targetUserId)] : [];
  const suppliers = await listDocuments(COLLECTION, constraints);
  return filterByScope(suppliers, scope);
}

export async function getFornecedores(scope = {}) {
  const suppliers = await listFornecedoresRaw(scope);
  return suppliers.map(normalizeFornecedor).sort((a, b) => a.nomeFantasia.localeCompare(b.nomeFantasia));
}

export async function getFornecedorById(id, scope = {}) {
  const suppliers = await getFornecedores(scope);
  return suppliers.find((supplier) => supplier.id === id) || null;
}

export async function validateCnpjUnico(cnpj, scope = {}, ignoreId = null) {
  const normalizedCnpj = normalizeCnpj(cnpj);
  if (!normalizedCnpj) return true;

  const suppliers = await getFornecedores(scope);
  const duplicate = suppliers.find((supplier) => supplier.cnpj === normalizedCnpj && supplier.id !== ignoreId);

  if (duplicate) {
    throw new Error('Ja existe um fornecedor cadastrado com este CNPJ para este usuario.');
  }

  return true;
}

export async function createFornecedor(payload, scope = {}) {
  const ownerId = requireOwnerId(scope);
  const data = sanitizeFornecedor(payload, { forCreate: true, ownerId });
  await validateCnpjUnico(data.cnpj, { ...scope, targetUserId: ownerId });

  return createDocument(COLLECTION, data);
}

export async function updateFornecedor(id, payload, scope = {}) {
  const ownerId = payload.userId || getTargetUserId(scope);
  const data = sanitizeFornecedor(payload, { ownerId });
  await validateCnpjUnico(data.cnpj, { ...scope, targetUserId: ownerId }, id);

  return updateDocument(COLLECTION, id, data);
}

export async function inativarFornecedor(id) {
  return updateDocument(COLLECTION, id, { ativo: false });
}
