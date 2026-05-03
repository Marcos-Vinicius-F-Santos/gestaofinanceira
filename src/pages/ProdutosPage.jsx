import { Download, Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import ProductForm from '../components/products/ProductForm';
import ProductsTable from '../components/products/ProductsTable';
import Alert from '../components/shared/Alert';
import LoadingState from '../components/shared/LoadingState';
import Modal from '../components/shared/Modal';
import PageHeader from '../components/shared/PageHeader';
import { useDataScope } from '../hooks/useDataScope';
import { getContas } from '../services/planoContasService';
import { createProduto, deleteProduto, getProdutos, updateProduto } from '../services/produtoService';
import { exportToCSV } from '../utils/csv';

export default function ProdutosPage() {
  const scope = useDataScope();
  const [products, setProducts] = useState([]);
  const [contas, setContas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [actionError, setActionError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadProducts = useCallback(async () => {
    if (!scope.effectiveUserId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setActionError('');

    try {
      const [loadedProducts, loadedContas] = await Promise.all([getProdutos(scope), getContas(scope)]);
      setProducts(loadedProducts);
      setContas(loadedContas.filter((conta) => conta.ativo));
    } catch (err) {
      setActionError(err.message || 'Nao foi possivel carregar produtos.');
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    setFeedback('');
    setActionError('');

    try {
      if (currentProduct) {
        await updateProduto(currentProduct.id, payload, scope);
        setCurrentProduct(null);
        setModalOpen(false);
        setFeedback('Produto atualizado com sucesso.');
      } else {
        await createProduto(payload, scope);
        setModalOpen(false);
        setFeedback('Produto cadastrado com sucesso.');
      }
      await loadProducts();
    } catch (err) {
      setActionError(err.message || 'Nao foi possivel salvar o produto.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setFeedback('');
    setActionError('');

    try {
      await deleteProduto(id);
      setFeedback('Produto inativado.');
      await loadProducts();
    } catch (err) {
      setActionError(err.message || 'Nao foi possivel inativar o produto.');
    }
  };

  const exportProducts = () => {
    exportToCSV(
      'produtos.csv',
      products.map((product) => ({
        codigo: product.codigo,
        nome: product.nome,
        categoria: product.categoria,
        subcategoria: product.subcategoria,
        unidadeMedida: product.unidadeMedida,
        controlaEstoque: product.controlaEstoque ? 'sim' : 'nao',
        estoqueAtual: product.estoqueAtual,
        contaPadrao: product.contaPadraoNome || '',
        subcontaPadrao: product.subcontaPadraoNome || '',
        ativo: product.ativo ? 'sim' : 'nao',
      })),
      ['codigo', 'nome', 'categoria', 'subcategoria', 'unidadeMedida', 'controlaEstoque', 'estoqueAtual', 'contaPadrao', 'subcontaPadrao', 'ativo'],
    );
  };

  if (loading) return <LoadingState label="Carregando produtos..." />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Produtos"
        description="Cadastre produtos com codigo unico para movimentar, consultar precos e controlar estoque quando necessario."
        action={
          <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-2">
            <button type="button" className="btn-primary w-full" onClick={() => { setCurrentProduct(null); setModalOpen(true); }}>
              <Plus className="h-4 w-4" />
              Novo Produto
            </button>
            <button type="button" className="btn-secondary w-full" onClick={exportProducts}>
              <Download className="h-4 w-4" />
              Exportar
            </button>
          </div>
        }
      />
      <Alert variant="error">{actionError}</Alert>
      <Alert variant="success">{feedback}</Alert>
      <ProductsTable
        items={products}
        onEdit={(product) => {
          setCurrentProduct(product);
          setModalOpen(true);
        }}
        onDelete={handleDelete}
      />
      {modalOpen ? (
        <Modal
          title={currentProduct ? 'Editar produto' : 'Novo produto'}
          description="Preencha os dados principais do produto."
          onClose={() => {
            setModalOpen(false);
            setCurrentProduct(null);
          }}
        >
          <ProductForm
            currentProduct={currentProduct}
            contas={contas}
            scope={scope}
            onSubmit={handleSubmit}
            onCancel={() => {
              setModalOpen(false);
              setCurrentProduct(null);
            }}
            submitting={submitting}
          />
        </Modal>
      ) : null}
    </div>
  );
}
