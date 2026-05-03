import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { byField, createDocument, listDocuments, updateDocument } from './firestoreService';
import { filterByScope, getTargetUserId, requireOwnerId } from './accessScope';
import { normalizeImportKey, parsePlanoContasText } from '../utils/planoContasImport';

const CONTAS_COLLECTION = 'contas';
const SUBCONTAS_COLLECTION = 'subcontas';
const MAX_BATCH_OPERATIONS = 450;

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

function contaImportKey(conta) {
  return `${normalizeImportKey(conta.nome || conta.conta)}::${conta.tipo}`;
}

function subcontaImportKey(contaKey, subcontaNome) {
  return `${contaKey}::${normalizeImportKey(subcontaNome)}`;
}

async function buildPlanoContasImportPlan(text, scope = {}) {
  const ownerId = requireOwnerId(scope);
  const parsed = parsePlanoContasText(text);
  const [existingContas, existingSubcontas] = await Promise.all([
    getContas(scope),
    getSubcontas(scope),
  ]);

  const existingContasByKey = new Map(existingContas.map((conta) => [contaImportKey(conta), conta]));
  const existingSubcontasByKey = new Set(
    existingSubcontas.map((subconta) => {
      const conta = existingContas.find((item) => item.id === subconta.contaId);
      const contaKey = conta ? contaImportKey(conta) : `${subconta.contaId}::`;
      return subcontaImportKey(contaKey, subconta.nome);
    }),
  );
  const plannedContasByKey = new Map();
  const seenSubcontasByKey = new Set();
  const duplicateSubcontas = [];
  const subcontasToCreate = [];

  parsed.rows.forEach((row) => {
    const contaKey = contaImportKey(row);
    const existingConta = existingContasByKey.get(contaKey);

    if (!plannedContasByKey.has(contaKey)) {
      plannedContasByKey.set(contaKey, {
        key: contaKey,
        id: existingConta?.id || '',
        nome: row.conta,
        tipo: row.tipo,
        isNew: !existingConta,
      });
    }

    const subcontaKey = subcontaImportKey(contaKey, row.subconta);
    const isDuplicatedInFile = seenSubcontasByKey.has(subcontaKey);
    const isDuplicatedInFirestore = existingConta && existingSubcontasByKey.has(subcontaKey);

    if (isDuplicatedInFile || isDuplicatedInFirestore) {
      duplicateSubcontas.push({
        lineNumber: row.lineNumber,
        conta: row.conta,
        subconta: row.subconta,
        reason: isDuplicatedInFile ? 'Repetida no arquivo' : 'Ja existente',
      });
    } else {
      subcontasToCreate.push({
        contaKey,
        nome: row.subconta,
      });
    }

    seenSubcontasByKey.add(subcontaKey);
  });

  const plannedContas = Array.from(plannedContasByKey.values());
  const contasToCreate = plannedContas.filter((conta) => conta.isNew);
  const firstContaKey = parsed.rows[0] ? contaImportKey(parsed.rows[0]) : '';

  return {
    ownerId,
    parsed,
    plannedContas,
    plannedContasByKey,
    contasToCreate,
    subcontasToCreate,
    duplicateSubcontas,
    firstContaKey,
  };
}

function toImportSummary(plan) {
  return {
    totalLinhas: plan.parsed.totalLines,
    contasNovas: plan.contasToCreate.length,
    contasExistentes: plan.plannedContas.length - plan.contasToCreate.length,
    subcontasNovas: plan.subcontasToCreate.length,
    subcontasDuplicadasIgnoradas: plan.duplicateSubcontas.length,
    linhasInvalidas: plan.parsed.invalidLines,
    subcontasDuplicadas: plan.duplicateSubcontas,
    podeImportar: plan.parsed.invalidLines.length === 0 && plan.subcontasToCreate.length > 0,
  };
}

async function commitInChunks(operations) {
  for (let index = 0; index < operations.length; index += MAX_BATCH_OPERATIONS) {
    const batch = writeBatch(db);
    const chunk = operations.slice(index, index + MAX_BATCH_OPERATIONS);

    chunk.forEach((operation) => {
      batch.set(operation.ref, operation.data);
    });

    await batch.commit();
  }
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
  const contaNome = normalizeText(payload.contaNome);

  if (!contaId) throw new Error('Selecione a conta vinculada.');
  if (!nome) throw new Error('Informe o nome da subconta.');

  return createDocument(SUBCONTAS_COLLECTION, {
    userId: ownerId,
    contaId,
    contaNome,
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

export async function previewPlanoContasImport(text, scope = {}) {
  const plan = await buildPlanoContasImportPlan(text, scope);
  return toImportSummary(plan);
}

export async function importPlanoContasFromText(text, scope = {}) {
  const plan = await buildPlanoContasImportPlan(text, scope);

  if (plan.parsed.invalidLines.length) {
    throw new Error('Corrija as linhas invalidas antes de confirmar a importacao.');
  }

  if (!plan.subcontasToCreate.length) {
    return {
      ...toImportSummary(plan),
      firstContaId: plan.plannedContasByKey.get(plan.firstContaKey)?.id || '',
    };
  }

  const contaRefsByKey = new Map();
  const operations = [];

  plan.contasToCreate.forEach((conta) => {
    const ref = doc(collection(db, CONTAS_COLLECTION));
    contaRefsByKey.set(conta.key, ref);
    operations.push({
      ref,
      data: {
        userId: plan.ownerId,
        nome: conta.nome,
        tipo: conta.tipo,
        ativo: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
    });
  });

  plan.subcontasToCreate.forEach((subconta) => {
    const conta = plan.plannedContasByKey.get(subconta.contaKey);
    const contaRef = contaRefsByKey.get(subconta.contaKey);
    const contaId = conta.id || contaRef?.id;

    operations.push({
      ref: doc(collection(db, SUBCONTAS_COLLECTION)),
      data: {
        userId: plan.ownerId,
        contaId,
        contaNome: conta.nome,
        nome: subconta.nome,
        ativo: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
    });
  });

  await commitInChunks(operations);

  const firstConta = plan.plannedContasByKey.get(plan.firstContaKey);
  return {
    ...toImportSummary(plan),
    firstContaId: firstConta?.id || contaRefsByKey.get(plan.firstContaKey)?.id || '',
  };
}
