import { getProdutos, getQuantidadeAtual } from './produtoService';
import { getMovimentacoes } from './stockService';

function isLowStock(product) {
  if (product.estoqueMinimo === '' || product.estoqueMinimo === undefined || product.estoqueMinimo === null) {
    return false;
  }

  return getQuantidadeAtual(product) <= Number(product.estoqueMinimo);
}

export async function getProdutosReport() {
  const products = await getProdutos();

  return products.map((product) => ({
    id: product.id,
    codigo: product.codigo,
    nome: product.nome,
    unidadeMedida: product.unidadeMedida || '-',
    quantidadeAtual: getQuantidadeAtual(product),
    estoqueMinimo: product.estoqueMinimo === '' ? '-' : product.estoqueMinimo,
    status: isLowStock(product) ? 'baixo' : 'normal',
    updatedAt: product.updatedAt,
  }));
}

export async function getMovimentacoesReport(filters = {}) {
  const movements = await getMovimentacoes();

  return movements.filter((movement) => {
    const matchesCodigo = !filters.codigo || movement.produtoCodigo?.toLowerCase().includes(filters.codigo.toLowerCase());
    const matchesTipo = !filters.tipo || movement.tipo === filters.tipo;
    const matchesStart = !filters.startDate || movement.data >= filters.startDate;
    const matchesEnd = !filters.endDate || movement.data <= filters.endDate;

    return matchesCodigo && matchesTipo && matchesStart && matchesEnd;
  });
}
