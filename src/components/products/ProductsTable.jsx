import { Pencil, Trash2 } from 'lucide-react';
import EmptyState from '../shared/EmptyState';
import StatusBadge from '../shared/StatusBadge';
import { formatDate } from '../../utils/formatters';

export default function ProductsTable({ items, onEdit, onDelete }) {
  if (!items.length) {
    return <EmptyState title="Nenhum produto cadastrado" description="Cadastre produtos antes de registrar movimentacoes." />;
  }

  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {['Codigo', 'Produto', 'Categoria', 'Conta padrao', 'Subconta padrao', 'Unidade', 'Estoque', 'Status', 'Atualizado', 'Acoes'].map((label) => (
                <th key={label} className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {items.map((item, index) => (
              <tr key={item.id} className={`${index % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'} transition hover:bg-blue-50/60`}>
                <td className="whitespace-nowrap px-4 py-3.5 font-mono text-sm font-bold text-slate-800">{item.codigo}</td>
                <td className="min-w-52 px-4 py-3.5">
                  <p className="text-sm font-bold text-slate-900">{item.nome}</p>
                  <p className="text-xs text-slate-500">{item.subcategoria || '-'}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">{item.categoria || '-'}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">{item.contaPadraoNome || '-'}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">{item.subcontaPadraoNome || '-'}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">{item.unidadeMedida || '-'}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-sm font-bold text-slate-800">{item.controlaEstoque ? item.estoqueAtual : '-'}</td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <StatusBadge value={item.ativo ? 'ativo' : 'inativo'} />
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">{formatDate(item.updatedAt)}</td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <div className="flex gap-2">
                    <button type="button" className="table-action" onClick={() => onEdit(item)} aria-label="Editar produto">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button type="button" className="table-action text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700" onClick={() => onDelete(item.id)} aria-label="Inativar produto">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
