import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { byField, listDocuments } from './firestoreService';
import { filterByScope, getTargetUserId, requireOwnerId } from './accessScope';
import { getProdutoByCodigo, getQuantidadeAtual, normalizeCodigo, normalizeProduto } from './produtoService';

function normalizeText(value) {
  return String(value || '').trim();
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function validateMovimentacao(payload) {
  const codigo = normalizeCodigo(payload.codigoProduto || payload.codigo || payload.produtoCodigo);
  const tipo = payload.tipo || payload.tipoMovimentacao;
  const quantidade = Number(payload.quantidade);

  if (!codigo) {
    throw new Error('Informe o codigo do produto.');
  }

  if (!['entrada', 'saida'].includes(tipo)) {
    throw new Error('Tipo de movimentacao invalido.');
  }

  if (Number.isNaN(quantidade) || quantidade <= 0) {
    throw new Error('Informe uma quantidade maior que zero.');
  }

  return {
    codigo,
    tipo,
    quantidade,
    nome: normalizeText(payload.nomeProduto || payload.nome || payload.produto),
    data: payload.data || todayIso(),
    observacao: normalizeText(payload.observacao),
  };
}

export async function createMovimentacao(payload, scope = {}) {
  const ownerId = requireOwnerId(scope);
  const scoped = { ...scope, targetUserId: ownerId };
  const data = validateMovimentacao(payload);
  const product = await getProdutoByCodigo(data.codigo, scoped);

  if (!product) {
    throw new Error('Produto nao encontrado. Cadastre o produto antes de movimentar.');
  }

  const normalizedProduct = normalizeProduto(product);
  const currentQuantity = getQuantidadeAtual(normalizedProduct);
  const nextQuantity = data.tipo === 'entrada'
    ? currentQuantity + data.quantidade
    : currentQuantity - data.quantidade;

  if (nextQuantity < 0) {
    throw new Error('Estoque insuficiente para registrar esta saida.');
  }

  const batch = writeBatch(db);
  const productRef = doc(db, 'produtos', normalizedProduct.id);
  const movementRef = doc(collection(db, 'movimentacoes'));
  const now = serverTimestamp();

  batch.update(productRef, {
    quantidadeAtual: nextQuantity,
    quantidade: nextQuantity,
    updatedAt: now,
  });

  batch.set(movementRef, {
    userId: ownerId,
    produtoId: normalizedProduct.id,
    produtoCodigo: normalizedProduct.codigo,
    produtoNome: normalizedProduct.nome,
    tipo: data.tipo,
    quantidade: data.quantidade,
    data: data.data,
    observacao: data.observacao,
    saldoAnterior: currentQuantity,
    saldoPosterior: nextQuantity,
    createdAt: now,
    updatedAt: now,
  });

  await batch.commit();
  return normalizedProduct.id;
}

export async function getMovimentacoes(scope = {}) {
  const targetUserId = getTargetUserId(scope);
  const constraints = targetUserId ? [byField('userId', '==', targetUserId)] : [];
  const movements = await listDocuments('movimentacoes', constraints);

  return filterByScope(movements, scope)
    .sort((a, b) => String(b.data || b.createdAt || '').localeCompare(String(a.data || a.createdAt || '')));
}

export async function getUltimaMovimentacao(produtoId = null, scope = {}) {
  const movements = await getMovimentacoes(scope);
  return movements.find((movement) => !produtoId || movement.produtoId === produtoId) || null;
}

export async function getMovimentacoesByProduto(produtoId, scope = {}) {
  const movements = await getMovimentacoes(scope);

  return movements
    .filter((movement) => movement.produtoId === produtoId)
    .sort((a, b) => String(b.data || b.createdAt || '').localeCompare(String(a.data || a.createdAt || '')));
}
