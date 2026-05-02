export const emptyFilters = {
  startDate: '',
  endDate: '',
  tipo: '',
  status: '',
};

export function applyLancamentoFilters(items, filters) {
  return items.filter((item) => {
    const matchesStart = !filters.startDate || item.data >= filters.startDate;
    const matchesEnd = !filters.endDate || item.data <= filters.endDate;
    const matchesTipo = !filters.tipo || item.tipo === filters.tipo;
    const matchesStatus = !filters.status || item.status === filters.status;

    return matchesStart && matchesEnd && matchesTipo && matchesStatus;
  });
}

export function sortByDateDesc(items) {
  return [...items].sort((a, b) => String(b.data || '').localeCompare(String(a.data || '')));
}
