const variants = {
  pago: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  recebido: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  pendente: 'border-amber-200 bg-amber-50 text-amber-700',
  aberto: 'border-blue-200 bg-blue-50 text-blue-700',
  vencido: 'border-amber-300 bg-amber-50 text-amber-800',
  atrasado: 'border-amber-300 bg-amber-50 text-amber-800',
  receita: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  despesa: 'border-red-200 bg-red-50 text-red-700',
  entrada: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  saida: 'border-red-200 bg-red-50 text-red-700',
  entrada_estoque: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  saida_estoque: 'border-red-200 bg-red-50 text-red-700',
  normal: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  baixo: 'border-amber-300 bg-amber-50 text-amber-800',
  ativa: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  ativo: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  pending: 'border-amber-300 bg-amber-50 text-amber-800',
  blocked: 'border-red-200 bg-red-50 text-red-700',
  inativo: 'border-slate-200 bg-slate-100 text-slate-600',
  user: 'border-blue-200 bg-blue-50 text-blue-700',
  client: 'border-blue-200 bg-blue-50 text-blue-700',
  admin: 'border-violet-200 bg-violet-50 text-violet-700',
};

export default function StatusBadge({ value }) {
  const label = String(value || '').replaceAll('_', ' ');

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${variants[value] || 'border-slate-200 bg-slate-100 text-slate-700'}`}>
      {label}
    </span>
  );
}
