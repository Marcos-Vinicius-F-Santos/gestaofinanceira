import { byField, createDocument, listDocuments, updateDocument } from './firestoreService';
import { filterByScope, getTargetUserId, requireOwnerId } from './accessScope';

const COLLECTION = 'produtos';

export function normalizeCodigo(codigo) {
  return String(codigo || '').trim().toUpperCase();
}

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeOptionalNumber(value, fallback = 0) {
  if (value === '' || value === undefined || value === null) return fallback;
  return Number(value);
}

export function getEstoqueAtual(product) {
  return Number(product?.estoqueAtual ?? product?.quantidadeAtual ?? product?.quantidade ?? 0);
}

export const getQuantidadeAtual = getEstoqueAtual;

export function normalizeProduto(product) {
  if (!product) return null;

  const estoqueAtual = getEstoqueAtual(product);

  return {
    ...product,
    codigo: normalizeCodigo(product.codigo),
    nome: normalizeText(product.nome || product.produto),
    categoria: normalizeText(product.categoria),
    subcategoria: normalizeText(product.subcategoria),
    unidadeMedida: normalizeText(product.unidadeMedida),
    controlaEstoque: Boolean(product.controlaEstoque),
    estoqueAtual,
    quantidadeAtual: estoqueAtual,
    ativo: product.ativo !== false,
  };
}

function sanitizeProduto(payload, { forCreate = false, ownerId = '' } = {}) {
  const codigo = normalizeCodigo(payload.codigo);
  const nome = normalizeText(payload.nome);
  const estoqueAtual = normalizeOptionalNumber(payload.estoqueAtual ?? payload.quantidadeAtual, 0);

  if (!codigo) {
    throw new Error('Informe o codigo do produto.');
  }

  if (!nome) {
    throw new Error('Informe o nome do produto.');
  }

  if (Number.isNaN(estoqueAtual)) {
    throw new Error('Estoque atual deve ser numerico.');
  }

  const data = {
    codigo,
    nome,
    categoria: normalizeText(payload.categoria),
    subcategoria: normalizeText(payload.subcategoria),
    unidadeMedida: normalizeText(payload.unidadeMedida),
    controlaEstoque: Boolean(payload.controlaEstoque),
    estoqueAtual,
    ativo: payload.ativo !== false,
  };

  if (forCreate) {
    data.userId = ownerId;
  }

  return data;
}

async function listProdutosRaw(scope = {}) {
  const targetUserId = getTargetUserId(scope);
  const constraints = targetUserId ? [byField('userId', '==', targetUserId)] : [];
  const products = await listDocuments(COLLECTION, constraints);
  return filterByScope(products, scope);
}

export async function getProdutos(scope = {}) {
  const products = await listProdutosRaw(scope);
  return products.map(normalizeProduto).sort((a, b) => a.codigo.localeCompare(b.codigo));
}

export async function getProdutoById(id, scope = {}) {
  const products = await getProdutos(scope);
  return products.find((product) => product.id === id) || null;
}

export async function getProdutoByCodigo(codigo, scope = {}) {
  const normalizedCodigo = normalizeCodigo(codigo);
  const products = await getProdutos(scope);
  return products.find((product) => product.codigo === normalizedCodigo) || null;
}

export async function validateCodigoUnico(codigo, scope = {}, ignoreId = null) {
  const normalizedCodigo = normalizeCodigo(codigo);
  const products = await getProdutos(scope);
  const duplicate = products.find((product) => product.codigo === normalizedCodigo && product.id !== ignoreId);

  if (duplicate) {
    throw new Error('Ja existe um produto cadastrado com este codigo para este usuario.');
  }

  return true;
}

export async function createProduto(payload, scope = {}) {
  const ownerId = requireOwnerId(scope);
  const data = sanitizeProduto(payload, { forCreate: true, ownerId });
  await validateCodigoUnico(data.codigo, { ...scope, targetUserId: ownerId });

  return createDocument(COLLECTION, data);
}

export async function updateProduto(id, payload, scope = {}) {
  const ownerId = payload.userId || getTargetUserId(scope);
  const data = sanitizeProduto(payload, { ownerId });
  await validateCodigoUnico(data.codigo, { ...scope, targetUserId: ownerId }, id);

  return updateDocument(COLLECTION, id, data);
}

export async function inativarProduto(id) {
  return updateDocument(COLLECTION, id, { ativo: false });
}

export async function deleteProduto(id) {
  return inativarProduto(id);
}
