function escapeCsv(value) {
  const dateValue = value?.toDate?.()?.toISOString?.();
  const safeValue = dateValue || (value ?? '');
  return `"${String(safeValue).replaceAll('"', '""')}"`;
}

export function exportToCSV(filename, rows, columns = null) {
  if (!rows.length) return;

  const headers = columns || Object.keys(rows[0]);
  const lines = [
    headers.map(escapeCsv).join(','),
    ...rows.map((row) => headers.map((key) => escapeCsv(row[key])).join(',')),
  ];
  const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export const exportToCsv = exportToCSV;
