import { byField, listDocuments, updateDocument } from './firestoreService';
import { filterByScope, getTargetUserId } from './accessScope';

const COLLECTION = 'parcelas';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function isOverdue(dateValue) {
  return Boolean(dateValue && dateValue < todayIso());
}

export function getStatusContaPagar(parcela) {
  if (parcela.status === 'paga' || parcela.dataPagamento) return 'pago';
  if (isOverdue(parcela.dataVencimento)) return 'vencido';
  return 'aberto';
}

export function getStatusContaReceber(parcela) {
  if (parcela.status === 'recebido' || parcela.dataRecebimento) return 'recebido';
  if (isOverdue(parcela.dataVencimento)) return 'atrasado';
  return 'aberto';
}

export function getParcelaStatus(parcela) {
  if (parcela.tipo === 'receita') return getStatusContaReceber(parcela);
  return getStatusContaPagar(parcela);
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
    status: 'paga',
    dataPagamento,
  });
}

export const marcarComoPago = marcarParcelaPaga;

export async function marcarParcelaRecebida(id, dataRecebimento = todayIso()) {
  return updateDocument(COLLECTION, id, {
    status: 'recebido',
    dataRecebimento,
  });
}

export const marcarComoRecebido = marcarParcelaRecebida;

export async function editarVencimentoParcela(id, dataVencimento) {
  if (!dataVencimento) {
    throw new Error('Informe a nova data de vencimento.');
  }

  return updateDocument(COLLECTION, id, {
    dataVencimento,
  });
}
