import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import Card from '../shared/Card';

export default function FinanceChart({ data }) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-1 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-ink sm:text-lg">Receitas x despesas</h2>
          <p className="text-sm text-slate-500">Resumo agrupado por tipo de lancamento</p>
        </div>
      </div>
      <div className="h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
            <YAxis tickFormatter={(value) => formatCurrency(value)} width={84} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ borderRadius: 8, borderColor: '#e2e8f0' }} />
            <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.name === 'Receitas' ? '#059669' : '#dc2626'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
