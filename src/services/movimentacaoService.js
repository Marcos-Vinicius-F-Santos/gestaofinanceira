import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { byField, listDocuments } from './firestoreService';
import { requireOwnerId, filterByScope, getTargetUserId } from './accessScope';
import { getFornecedorById } from './fornecedorService';
import { getEstoqueAtual, getProdutoByCodigo, getProdutoById, normalizeProduto } from './produtoService';

const COLLECTION = 'movimentacoes';
const PARCELAS_COLLECTION = 'parcelas';

const VALID_TYPES = ['despesa', 'receita'];

function normalizeText(value) {
  return String(value || '').trim();
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addMonths(dateValue, months) {
  const date = new Date(`${dateValue}T00:00:00`);
  const day = date.getDate();
  date.setMonth(date.getMonth() + months);

  if (date.getDate() < day) {
    date.setDate(0);
  }

  return date.toISOString().slice(0, 10);
}

function moneyParts(total, installments) {
  const cents = Math.round(Number(total || 0) * 100);
  const base = Math.floor(cents / installments);
  const remainder = cents - base * installments;

  return Array.from({ length: installments }, (_, index) => (base + (index === installments - 1 ? remainder : 0)) / 100);
}

function parsePositiveNumber(value, fieldName) {
  const parsed = Number(value);

  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} deve ser maior que zero.`);
  }

  return parsed;
}

function parseCurrency(value) {
  const parsed = Number(value);

  if (Number.isNaN(parsed) || parsed < 0) {
    throw new Error('Valor total deve ser numerico e nao negativo.');
  }

  return parsed;
}

function stockDirection(operacao) {
  if (operacao === 'entrada') return 1;
  if (operacao === 'saida') return -1;
  return 0;
}

async function getProdutoFromPayload(payload, scope) {
  if (payload.produtoId) {
    return getProdutoById(payload.produtoId, scope);
  }

  if (payload.produtoCodigo || payload.codigoProduto) {
    return getProdutoByCodigo(payload.produtoCodigo || payload.codigoProduto, scope);
  }

  return null;
}

function sanitizeMovimentacao(payload, product, supplier, ownerId) {
  const tipo = payload.tipo;
  const quantidade = parsePositiveNumber(payload.quantidade, 'Quantidade');
  const valorTotal = parseCurrency(payload.valorTotal);
  const controlaEstoque = Boolean(payload.controlaEstoque ?? product.controlaEstoque);
  const movimentacaoEstoque = controlaEstoque ? payload.movimentacaoEstoque || 'entrada' : '';
  const valorUnitario = quantidade > 0 ? valorTotal / quantidade : 0;
  const possuiParcelamento = Boolean(payload.possuiParcelamento);
  const totalParcelas = possuiParcelamento ? Number(payload.numeroParcelas || payload.parcelas || 1) : 1;
  const dataReferencia = payload.dataReferencia || todayIso();
  const primeiroVencimento = payload.primeiroVencimento || dataReferencia;
  const contaId = normalizeText(payload.contaId);
  const subContaId = normalizeText(payload.subContaId || payload.subcontaId);
  const conta = normalizeText(payload.conta || payload.contaNome);
  const subConta = normalizeText(payload.subConta || payload.subconta || payload.subcontaNome);

  if (!VALID_TYPES.includes(tipo)) {
    throw new Error('Tipo de movimentacao invalido.');
  }

  if (controlaEstoque && !['entrada', 'saida'].includes(movimentacaoEstoque)) {
    throw new Error('Informe se a movimentacao de estoque e entrada ou saida.');
  }

  if (!product?.id) {
    throw new Error('Produto nao encontrado. Cadastre o produto antes de movimentar.');
  }

  if (!supplier?.id) {
    throw new Error('Informe um fornecedor cadastrado.');
  }

  if (!contaId || !conta) {
    throw new Error('Selecione uma conta.');
  }

  if (!subContaId || !subConta) {
    throw new Error('Selecione uma subconta.');
  }

  if (possuiParcelamento && (!Number.isInteger(totalParcelas) || totalParcelas <= 0)) {
    throw new Error('Informe uma quantidade valida de parcelas.');
  }

  if (possuiParcelamento && !primeiroVencimento) {
    throw new Error('Informe o primeiro vencimento das parcelas.');
  }

  return {
    userId: ownerId,
    produtoId: product.id,
    produtoCodigo: product.codigo,
    produtoNome: product.nome,
    fornecedorId: supplier.id,
    fornecedorNome: supplier.nomeFantasia,
    tipo,
    centroCusto: normalizeText(payload.centroCusto),
    responsavel: normalizeText(payload.responsavel),
    tipoLancamento: normalizeText(payload.tipoLancamento),
    fazenda: normalizeText(payload.fazenda),
    contaId,
    conta,
    contaNome: conta,
    subContaId,
    subConta,
    subcontaNome: subConta,
    descricao: normalizeText(payload.descricao),
    quantidade,
    valorTotal,
    valorUnitario,
    dataReferencia,
    dataEmissao: payload.dataEmissao || dataReferencia,
    numeroNota: normalizeText(payload.numeroNota),
    observacao: normalizeText(payload.observacao),
    controlaEstoque,
    movimentacaoEstoque,
    possuiParcelamento,
    parcelas: totalParcelas,
    primeiroVencimento,
  };
}

function buildParcelas(movement, movementId) {
  const values = moneyParts(movement.valorTotal, movement.parcelas);

  return values.map((valorParcela, index) => ({
    userId: movement.userId,
    movimentacaoId: movementId,
    tipo: movement.tipo,
    produtoId: movement.produtoId,
    produtoNome: movement.produtoNome,
    fornecedorId: movement.fornecedorId,
    fornecedorNome: movement.fornecedorNome,
    contaId: movement.contaId,
    conta: movement.conta,
    contaNome: movement.contaNome || movement.conta,
    subContaId: movement.subContaId,
    subConta: movement.subConta,
    subcontaNome: movement.subcontaNome || movement.subConta,
    numeroParcela: index + 1,
    totalParcelas: movement.parcelas,
    valorParcela,
    dataVencimento: addMonths(movement.primeiroVencimento, index),
    status: 'aberta',
    dataPagamento: '',
    dataRecebimento: '',
  }));
}

export async function createMovimentacao(payload, scope = {}) {
  const ownerId = requireOwnerId(scope);
  const scoped = { ...scope, targetUserId: ownerId };
  const product = normalizeProduto(await getProdutoFromPayload(payload, scoped));
  const supplier = await getFornecedorById(payload.fornecedorId, scoped);
  const data = sanitizeMovimentacao(payload, product, supplier, ownerId);
  const saldoAnterior = getEstoqueAtual(product);
  const direction = data.controlaEstoque ? stockDirection(data.movimentacaoEstoque) : 0;
  const saldoPosterior = saldoAnterior + direction * data.quantidade;

  if (saldoPosterior < 0) {
    throw new Error('Estoque insuficiente para registrar esta saida.');
  }

  const movementPayload = {
    ...data,
    saldoAnterior,
    saldoPosterior,
  };

  const batch = writeBatch(db);
  const now = serverTimestamp();
  const movementRef = doc(collection(db, COLLECTION));

  if (direction !== 0) {
    batch.update(doc(db, 'produtos', product.id), {
      estoqueAtual: saldoPosterior,
      quantidadeAtual: saldoPosterior,
      updatedAt: now,
    });
  }

  batch.set(movementRef, {
    ...movementPayload,
    createdAt: now,
    updatedAt: now,
  });

  buildParcelas(movementPayload, movementRef.id).forEach((parcela) => {
    batch.set(doc(collection(db, PARCELAS_COLLECTION)), {
      ...parcela,
      createdAt: now,
      updatedAt: now,
    });
  });

  await batch.commit();
  return movementRef.id;
}

export async function getMovimentacoes(scope = {}) {
  const targetUserId = getTargetUserId(scope);
  const constraints = targetUserId ? [byField('userId', '==', targetUserId)] : [];
  const movements = await listDocuments(COLLECTION, constraints);

  return filterByScope(movements, scope).sort((a, b) =>
    String(b.dataReferencia || b.data || b.createdAt || '').localeCompare(String(a.dataReferencia || a.data || a.createdAt || '')),
  );
}

export async function getMovimentacoesByProduto(produtoId, scope = {}) {
  const movements = await getMovimentacoes(scope);
  return movements.filter((movement) => movement.produtoId === produtoId);
}

export async function getUltimaMovimentacao(scope = {}, produtoId = null) {
  const movements = produtoId ? await getMovimentacoesByProduto(produtoId, scope) : await getMovimentacoes(scope);
  return movements[0] || null;
}

export async function getHistoricoPrecos(produtoId, scope = {}) {
  const movements = await getMovimentacoesByProduto(produtoId, scope);

  return movements
    .filter((movement) => Number(movement.quantidade || 0) > 0)
    .map((movement) => ({
      ...movement,
      valorUnitario: Number(movement.valorUnitario ?? Number(movement.valorTotal || 0) / Number(movement.quantidade || 1)),
    }));
}
