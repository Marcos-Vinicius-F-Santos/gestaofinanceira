export function formatCurrency(value = 0) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0));
}

export function formatDate(value) {
  if (!value) return '-';

  const date =
    typeof value === 'string'
      ? new Date(value.length === 10 ? `${value}T00:00:00` : value)
      : value.toDate?.() || new Date(value);
  return new Intl.DateTimeFormat('pt-BR').format(date);
}
