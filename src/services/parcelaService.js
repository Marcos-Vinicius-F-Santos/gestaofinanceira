import { serverTimestamp } from 'firebase/firestore';
import { byField, listDocuments, updateDocument } from './firestoreService';
import { filterByScope, getTargetUserId } from './accessScope';
import { auth } from './firebase';

const COLLECTION = 'parcelas';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function isOverdue(dateValue) {
  return Boolean(dateValue && dateValue < todayIso());
}

function auditTimestamp() {
  return serverTimestamp();
}

function auditUserId(scope = {}) {
  return scope.uid || auth?.currentUser?.uid || '';
}

export function calculatePayableStatus(parcela) {
  if (parcela.dataPagamento) return 'pago';
  if (isOverdue(parcela.dataVencimento)) return 'vencido';
  return 'aberto';
}

export function calculateReceivableStatus(parcela) {
  if (parcela.dataRecebimento) return 'recebido';
  if (isOverdue(parcela.dataVencimento)) return 'atrasado';
  return 'aberto';
}

export const getStatusContaPagar = calculatePayableStatus;
export const getStatusContaReceber = calculateReceivableStatus;

export function getParcelaStatus(parcela) {
  if (parcela.tipo === 'receita') return calculateReceivableStatus(parcela);
  return calculatePayableStatus(parcela);
}

async function getParcelaById(id, scope = {}) {
  const parcelas = await getParcelas(scope);
  const parcela = parcelas.find((item) => item.id === id);

  if (!parcela) {
    throw new Error('Parcela nao encontrada.');
  }

  return parcela;
}

export async function getParcelas(scope = {}) {
  const targetUserId = getTargetUserId(scope);
  const constraints = targetUserId ? [byField('userId', '==', targetUserId)] : [];
  const parcelas = await listDocuments(COLLECTION, constraints);

  return filterByScope(parcelas, scope)
    .map((parcela) => ({ ...parcela, statusCalculado: getParcelaStatus(parcela) }))
    .sort((a, b) => String(a.dataVencimento || '').localeCompare(String(b.dataVencimento || '')));
}

export async function getParcelasByTipo(tipo, scope = {}) {
  const parcelas = await getParcelas(scope);
  return parcelas.filter((parcela) => parcela.tipo === tipo);
}

export const getContasPagar = (scope = {}) => getParcelasByTipo('despesa', scope);
export const getContasReceber = (scope = {}) => getParcelasByTipo('receita', scope);

export async function marcarParcelaPaga(id, dataPagamento = todayIso()) {
  return updateDocument(COLLECTION, id, {
    status: 'pago',
    dataPagamento,
  });
}

export const marcarComoPago = marcarParcelaPaga;

export async function desfazerPagamento(id, scope = {}) {
  const parcela = await getParcelaById(id, scope);
  const nextStatus = calculatePayableStatus({ ...parcela, dataPagamento: '' });

  return updateDocument(COLLECTION, id, {
    status: nextStatus,
    dataPagamento: '',
    baixaDesfeitaEm: auditTimestamp(),
    baixaDesfeitaPor: auditUserId(scope),
  });
}

export async function marcarParcelaRecebida(id, dataRecebimento = todayIso()) {
  return updateDocument(COLLECTION, id, {
    status: 'recebido',
    dataRecebimento,
  });
}

export const marcarComoRecebido = marcarParcelaRecebida;

export async function desfazerRecebimento(id, scope = {}) {
  const parcela = await getParcelaById(id, scope);
  const nextStatus = calculateReceivableStatus({ ...parcela, dataRecebimento: '' });

  return updateDocument(COLLECTION, id, {
    status: nextStatus,
    dataRecebimento: '',
    baixaDesfeitaEm: auditTimestamp(),
    baixaDesfeitaPor: auditUserId(scope),
  });
}

export async function editarVencimentoParcela(id, dataVencimento) {
  if (!dataVencimento) {
    throw new Error('Informe a nova data de vencimento.');
  }

  return updateDocument(COLLECTION, id, {
    dataVencimento,
  });
}
