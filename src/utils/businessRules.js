export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function getPayableStatus(item, today = todayIso()) {
  if (item.status === 'pago') return 'pago';
  if (item.data && item.data < today) return 'vencido';
  return 'aberto';
}

export function getReceivableStatus(item) {
  return item.status === 'recebido' ? 'recebido' : 'aberto';
}

export function normalizePayable(item) {
  return {
    ...item,
    tipo: 'despesa',
    status: getPayableStatus(item),
  };
}

export function normalizeReceivable(item) {
  return {
    ...item,
    tipo: 'receita',
    status: getReceivableStatus(item),
  };
}

export function normalizeLancamento(item) {
  if (item.tipo === 'despesa') {
    return {
      ...item,
      status: item.status === 'pago' ? 'pago' : getPayableStatus(item),
    };
  }

  if (item.tipo === 'receita') {
    return {
      ...item,
      status: item.status === 'recebido' ? 'recebido' : 'aberto',
    };
  }

  return item;
}
