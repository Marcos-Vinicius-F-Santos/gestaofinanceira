const STORE_KEY = 'gestao-pro-demo-store';
const AUTH_KEY = 'gestao-pro-demo-auth';

const collectionListeners = new Set();
const authListeners = new Set();

function nowIso() {
  return new Date().toISOString();
}

function dateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function makeId(prefix) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function buildSeedStore() {
  const timestamp = nowIso();

  return {
    users: [
      {
        id: 'demo_admin',
        uid: 'demo_admin',
        email: 'admin@teste.com',
        password: '123456',
        nome: 'Admin Demo',
        name: 'Admin Demo',
        role: 'admin',
        ativo: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: 'demo_user',
        uid: 'demo_user',
        email: 'cliente@teste.com',
        password: '123456',
        nome: 'Cliente Demo',
        name: 'Cliente Demo',
        role: 'client',
        status: 'active',
        ativo: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    produtos: [
      {
        id: 'prod_1',
        userId: 'demo_user',
        codigo: 'MILHO-001',
        nome: 'Milho saca 60kg',
        categoria: 'Insumos',
        subcategoria: 'Graos',
        unidadeMedida: 'sc',
        controlaEstoque: true,
        estoqueAtual: 34,
        ativo: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: 'prod_2',
        userId: 'demo_user',
        codigo: 'ADUBO-001',
        nome: 'Adubo NPK',
        categoria: 'Insumos',
        subcategoria: 'Fertilizantes',
        unidadeMedida: 'kg',
        controlaEstoque: true,
        estoqueAtual: 120,
        ativo: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    fornecedores: [
      {
        id: 'forn_1',
        userId: 'demo_user',
        nomeFantasia: 'Agro Vale',
        razaoSocial: 'Agro Vale Comercio Ltda',
        cnpj: '12345678000190',
        inscricaoEstadual: '',
        telefone: '(11) 99999-1000',
        email: 'comercial@agrovale.com',
        endereco: 'Estrada Principal, 100',
        descontoPadrao: 0,
        ativo: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: 'forn_2',
        userId: 'demo_user',
        nomeFantasia: 'Cooperativa Central',
        razaoSocial: 'Cooperativa Central Rural',
        cnpj: '98765432000110',
        inscricaoEstadual: '',
        telefone: '(11) 98888-2000',
        email: 'vendas@coopcentral.com',
        endereco: 'Rua da Cooperativa, 22',
        descontoPadrao: 2,
        ativo: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    contas: [
      {
        id: 'conta_desp_1',
        userId: 'demo_user',
        nome: 'Insumos',
        tipo: 'despesa',
        ativo: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: 'conta_desp_2',
        userId: 'demo_user',
        nome: 'Compras',
        tipo: 'despesa',
        ativo: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: 'conta_rec_1',
        userId: 'demo_user',
        nome: 'Venda de Produtos',
        tipo: 'receita',
        ativo: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    subcontas: [
      {
        id: 'sub_desp_1',
        userId: 'demo_user',
        contaId: 'conta_desp_1',
        nome: 'Graos',
        ativo: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: 'sub_desp_2',
        userId: 'demo_user',
        contaId: 'conta_desp_2',
        nome: 'Fertilizantes',
        ativo: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: 'sub_rec_1',
        userId: 'demo_user',
        contaId: 'conta_rec_1',
        nome: 'Milho',
        ativo: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    movimentacoes: [
      {
        id: 'mov_1',
        userId: 'demo_user',
        produtoId: 'prod_1',
        produtoCodigo: 'MILHO-001',
        produtoNome: 'Milho saca 60kg',
        fornecedorId: 'forn_1',
        fornecedorNome: 'Agro Vale',
        tipo: 'despesa',
        centroCusto: 'Plantio',
        fazenda: 'Fazenda Boa Vista',
        contaId: 'conta_desp_1',
        conta: 'Insumos',
        subContaId: 'sub_desp_1',
        subConta: 'Graos',
        descricao: 'Compra de milho para estoque',
        quantidade: 20,
        valorTotal: 1800,
        valorUnitario: 90,
        dataReferencia: dateOffset(-7),
        dataEmissao: dateOffset(-7),
        numeroNota: 'NF-1001',
        observacao: 'Primeira compra do mes',
        controlaEstoque: true,
        movimentacaoEstoque: 'entrada',
        saldoAnterior: 14,
        saldoPosterior: 34,
        possuiParcelamento: true,
        parcelas: 2,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: 'mov_2',
        userId: 'demo_user',
        produtoId: 'prod_2',
        produtoCodigo: 'ADUBO-001',
        produtoNome: 'Adubo NPK',
        fornecedorId: 'forn_2',
        fornecedorNome: 'Cooperativa Central',
        tipo: 'despesa',
        centroCusto: 'Safra',
        fazenda: 'Fazenda Boa Vista',
        contaId: 'conta_desp_2',
        conta: 'Compras',
        subContaId: 'sub_desp_2',
        subConta: 'Fertilizantes',
        descricao: 'Compra de adubo',
        quantidade: 50,
        valorTotal: 1500,
        valorUnitario: 30,
        dataReferencia: dateOffset(-3),
        dataEmissao: dateOffset(-3),
        numeroNota: 'NF-2050',
        observacao: '',
        controlaEstoque: false,
        saldoAnterior: 120,
        saldoPosterior: 120,
        possuiParcelamento: false,
        parcelas: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    parcelas: [
      {
        id: 'parc_1',
        userId: 'demo_user',
        movimentacaoId: 'mov_1',
        produtoId: 'prod_1',
        fornecedorId: 'forn_1',
        numeroParcela: 1,
        tipo: 'despesa',
        fornecedorNome: 'Agro Vale',
        produtoNome: 'Milho saca 60kg',
        contaId: 'conta_desp_1',
        conta: 'Insumos',
        subContaId: 'sub_desp_1',
        subConta: 'Graos',
        totalParcelas: 2,
        valorParcela: 900,
        dataVencimento: dateOffset(-2),
        status: 'aberta',
        dataPagamento: '',
        dataRecebimento: '',
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: 'parc_2',
        userId: 'demo_user',
        movimentacaoId: 'mov_1',
        produtoId: 'prod_1',
        fornecedorId: 'forn_1',
        numeroParcela: 2,
        tipo: 'despesa',
        fornecedorNome: 'Agro Vale',
        produtoNome: 'Milho saca 60kg',
        contaId: 'conta_desp_1',
        conta: 'Insumos',
        subContaId: 'sub_desp_1',
        subConta: 'Graos',
        totalParcelas: 2,
        valorParcela: 900,
        dataVencimento: dateOffset(28),
        status: 'aberta',
        dataPagamento: '',
        dataRecebimento: '',
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
  };
}

function normalizeCode(value, fallback) {
  return String(value || fallback || '').trim().toUpperCase();
}

function migrateStore(store) {
  const seed = buildSeedStore();
  const timestamp = nowIso();
  let changed = false;

  store.users = (store.users?.length ? store.users : seed.users).map((user) => {
    if (!['cliente', 'user'].includes(user.role) && user.nome && user.status) return user;
    changed = true;
    return {
      ...user,
      nome: user.nome || user.name || user.email,
      name: user.name || user.nome || user.email,
      role: ['cliente', 'user'].includes(user.role) ? 'client' : user.role || 'client',
      status: user.status || (user.ativo === false ? 'blocked' : 'active'),
      ativo: user.ativo !== false,
    };
  });

  const defaultUserId = localStorage.getItem(AUTH_KEY) || store.users.find((user) => user.role !== 'admin')?.uid || 'demo_user';
  const legacyProducts = store.produtos?.length ? store.produtos : store.estoque || [];

  store.produtos = (legacyProducts.length ? legacyProducts : seed.produtos).map((item, index) => {
    const estoqueAtual = Number(item.estoqueAtual ?? item.quantidadeAtual ?? item.quantidade ?? 0);
    if (item.userId && item.estoqueAtual !== undefined && item.ativo !== undefined) return item;
    changed = true;
    return {
      id: item.id || `prod_${index + 1}`,
      userId: item.userId || defaultUserId,
      codigo: normalizeCode(item.codigo, `PRD-${String(index + 1).padStart(3, '0')}`),
      nome: item.nome || item.produto || `Produto ${index + 1}`,
      categoria: item.categoria || '',
      subcategoria: item.subcategoria || '',
      unidadeMedida: item.unidadeMedida || '',
      controlaEstoque: item.controlaEstoque !== false,
      estoqueAtual,
      quantidadeAtual: estoqueAtual,
      ativo: item.ativo !== false,
      createdAt: item.createdAt || timestamp,
      updatedAt: item.updatedAt || timestamp,
    };
  });

  const seededFornecedores = seed.fornecedores.map((item) => ({ ...item, userId: defaultUserId }));
  store.fornecedores = (store.fornecedores?.length ? store.fornecedores : seededFornecedores).map((item, index) => {
    if (item.userId && item.nomeFantasia && item.ativo !== undefined) return item;
    changed = true;
    return {
      ...item,
      id: item.id || `forn_${index + 1}`,
      userId: item.userId || defaultUserId,
      nomeFantasia: item.nomeFantasia || item.nome || item.razaoSocial || `Fornecedor ${index + 1}`,
      razaoSocial: item.razaoSocial || '',
      cnpj: item.cnpj || '',
      inscricaoEstadual: item.inscricaoEstadual || '',
      telefone: item.telefone || '',
      email: item.email || '',
      endereco: item.endereco || '',
      descontoPadrao: item.descontoPadrao || 0,
      ativo: item.ativo !== false,
      createdAt: item.createdAt || timestamp,
      updatedAt: item.updatedAt || timestamp,
    };
  });

  if (!store.fornecedores.some((item) => item.userId === defaultUserId)) {
    changed = true;
    store.fornecedores = [
      ...store.fornecedores,
      ...seededFornecedores.map((item) => ({
        ...item,
        id: `${item.id}_${defaultUserId}`,
        userId: defaultUserId,
        createdAt: timestamp,
        updatedAt: timestamp,
      })),
    ];
  }

  const seededContas = seed.contas.map((item) => ({ ...item, userId: defaultUserId }));
  store.contas = (store.contas?.length ? store.contas : seededContas).map((item, index) => {
    if (item.userId && item.nome && item.tipo && item.ativo !== undefined) return item;
    changed = true;
    return {
      ...item,
      id: item.id || `conta_${index + 1}`,
      userId: item.userId || defaultUserId,
      nome: item.nome || `Conta ${index + 1}`,
      tipo: item.tipo === 'receita' ? 'receita' : 'despesa',
      ativo: item.ativo !== false,
      createdAt: item.createdAt || timestamp,
      updatedAt: item.updatedAt || timestamp,
    };
  });

  const seededSubcontas = seed.subcontas.map((item) => ({ ...item, userId: defaultUserId }));
  store.subcontas = (store.subcontas?.length ? store.subcontas : seededSubcontas).map((item, index) => {
    if (item.userId && item.contaId && item.nome && item.ativo !== undefined) return item;
    changed = true;
    const conta = store.contas.find((contaItem) => contaItem.id === item.contaId) || store.contas[0];
    return {
      ...item,
      id: item.id || `subconta_${index + 1}`,
      userId: item.userId || defaultUserId,
      contaId: item.contaId || conta?.id || '',
      nome: item.nome || `Subconta ${index + 1}`,
      ativo: item.ativo !== false,
      createdAt: item.createdAt || timestamp,
      updatedAt: item.updatedAt || timestamp,
    };
  });

  const findConta = (item, tipo) => {
    const wantedName = item.conta || (tipo === 'receita' ? 'Venda de Produtos' : 'Insumos');
    return store.contas.find((conta) => conta.userId === (item.userId || defaultUserId) && conta.tipo === tipo && conta.nome === wantedName)
      || store.contas.find((conta) => conta.userId === (item.userId || defaultUserId) && conta.tipo === tipo)
      || store.contas.find((conta) => conta.tipo === tipo)
      || null;
  };

  const findSubconta = (item, conta) => {
    const wantedName = item.subConta || item.subconta || '';
    return store.subcontas.find((subconta) => subconta.contaId === conta?.id && subconta.nome === wantedName)
      || store.subcontas.find((subconta) => subconta.contaId === conta?.id)
      || null;
  };

  store.movimentacoes = (store.movimentacoes?.length ? store.movimentacoes : seed.movimentacoes).map((item, index) => {
    const legacyType = ['receita', 'despesa'].includes(item.tipo) ? item.tipo : 'despesa';
    const conta = findConta(item, legacyType);
    const subconta = findSubconta(item, conta);

    if (item.userId && item.produtoCodigo && item.valorUnitario !== undefined && item.dataReferencia && item.contaId && item.subContaId) return item;

    const product = store.produtos.find((productItem) =>
      productItem.id === item.produtoId
      || productItem.codigo === item.produtoCodigo
      || productItem.nome === item.produtoNome
      || productItem.nome === item.produto,
    ) || store.produtos[0];
    const supplier = store.fornecedores[0] || seed.fornecedores[0];
    const quantidade = Number(item.quantidade || 1);
    const valorTotal = Number(item.valorTotal || item.valor || 0);

    changed = true;
    return {
      ...item,
      id: item.id || `mov_${index + 1}`,
      userId: item.userId || defaultUserId,
      produtoId: item.produtoId || product?.id || '',
      produtoCodigo: item.produtoCodigo || product?.codigo || '',
      produtoNome: item.produtoNome || product?.nome || '',
      fornecedorId: item.fornecedorId || supplier?.id || '',
      fornecedorNome: item.fornecedorNome || supplier?.nomeFantasia || '',
      tipo: legacyType,
      centroCusto: item.centroCusto || '',
      fazenda: item.fazenda || '',
      contaId: item.contaId || conta?.id || '',
      conta: item.conta || item.categoria || conta?.nome || '',
      subContaId: item.subContaId || item.subcontaId || subconta?.id || '',
      subConta: item.subConta || item.subconta || subconta?.nome || '',
      descricao: item.descricao || item.observacao || '',
      quantidade,
      valorTotal,
      valorUnitario: item.valorUnitario ?? (quantidade > 0 ? valorTotal / quantidade : 0),
      dataReferencia: item.dataReferencia || item.data || timestamp.slice(0, 10),
      dataEmissao: item.dataEmissao || item.data || timestamp.slice(0, 10),
      numeroNota: item.numeroNota || '',
      observacao: item.observacao || '',
      controlaEstoque: Boolean(item.controlaEstoque),
      movimentacaoEstoque: item.movimentacaoEstoque || (['entrada', 'entrada_estoque'].includes(item.tipo) ? 'entrada' : 'saida'),
      saldoAnterior: item.saldoAnterior ?? '',
      saldoPosterior: item.saldoPosterior ?? '',
      possuiParcelamento: Boolean(item.possuiParcelamento),
      parcelas: Number(item.parcelas || 0),
      createdAt: item.createdAt || timestamp,
      updatedAt: item.updatedAt || timestamp,
    };
  });

  const hasParcelas = Boolean(store.parcelas?.length);
  if (!hasParcelas) changed = true;

  store.parcelas = (hasParcelas ? store.parcelas : seed.parcelas).map((item) => {
    const movement = store.movimentacoes.find((movementItem) => movementItem.id === item.movimentacaoId);
    const tipo = item.tipo || movement?.tipo || 'despesa';
    const conta = findConta({ ...item, userId: item.userId || movement?.userId, conta: item.conta || movement?.conta }, tipo);
    const subconta = findSubconta({ ...item, subConta: item.subConta || movement?.subConta }, conta);

    if (item.userId && item.tipo && item.fornecedorNome && item.produtoNome && item.dataRecebimento !== undefined && item.contaId && item.subContaId) return item;

    changed = true;

    return {
      ...item,
      userId: item.userId || movement?.userId || defaultUserId,
      tipo,
      fornecedorNome: item.fornecedorNome || movement?.fornecedorNome || '',
      produtoNome: item.produtoNome || movement?.produtoNome || '',
      contaId: item.contaId || movement?.contaId || conta?.id || '',
      conta: item.conta || movement?.conta || conta?.nome || '',
      subContaId: item.subContaId || movement?.subContaId || subconta?.id || '',
      subConta: item.subConta || movement?.subConta || subconta?.nome || '',
      dataPagamento: item.dataPagamento || '',
      dataRecebimento: item.dataRecebimento || '',
    };
  });
  store.estoque = store.estoque || store.produtos;
  store.lancamentos = store.lancamentos || [];
  store.contas_pagar = store.contas_pagar || [];
  store.contas_receber = store.contas_receber || [];

  return { store, changed };
}

function readStore() {
  const raw = localStorage.getItem(STORE_KEY);

  if (raw) {
    const { store, changed } = migrateStore(JSON.parse(raw));

    if (changed) {
      writeStore(store);
    }

    return store;
  }

  const seed = buildSeedStore();
  localStorage.setItem(STORE_KEY, JSON.stringify(seed));
  return seed;
}

function writeStore(store) {
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

function publicProfile(user) {
  if (!user) return null;
  const { password, ...profile } = user;
  return profile;
}

function sortCollection(items) {
  return [...items].sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
}

function notifyCollection(collectionName) {
  const store = readStore();
  collectionListeners.forEach((listener) => {
    if (listener.collectionName === collectionName) {
      listener.onData(sortCollection(store[collectionName] || []));
    }
  });
}

function notifyAuth() {
  const currentUser = getMockCurrentUser();
  authListeners.forEach((listener) => listener(currentUser));
}

export const demoCredentials = {
  admin: { email: 'admin@teste.com', password: '123456' },
  user: { email: 'cliente@teste.com', password: '123456' },
  client: { email: 'cliente@teste.com', password: '123456' },
  cliente: { email: 'cliente@teste.com', password: '123456' },
};

export function isMockMode() {
  return true;
}

export async function mockLogin(email, password) {
  const store = readStore();
  const profile = store.users.find((user) => user.email === email && user.password === password);

  if (!profile) {
    throw new Error('Usuario demo nao encontrado. Use cliente@teste.com / 123456.');
  }

  if (profile.role !== 'admin' && profile.status !== 'active') {
    throw new Error(profile.status === 'blocked'
      ? 'Seu acesso foi bloqueado. Entre em contato com o administrador.'
      : 'Seu acesso ainda nao foi liberado pelo administrador.');
  }

  localStorage.setItem(AUTH_KEY, profile.uid);
  notifyAuth();

  return {
    user: {
      uid: profile.uid,
      email: profile.email,
      displayName: profile.nome || profile.name,
    },
    profile: publicProfile(profile),
  };
}

export async function mockLogout() {
  localStorage.removeItem(AUTH_KEY);
  notifyAuth();
}

export function getMockCurrentUser() {
  const uid = localStorage.getItem(AUTH_KEY);
  if (!uid) return null;

  const store = readStore();
  const profile = store.users.find((user) => user.uid === uid);

  if (!profile) return null;

  return {
    uid: profile.uid,
    email: profile.email,
    displayName: profile.nome || profile.name,
  };
}

export async function mockGetUserProfile(uid) {
  const store = readStore();
  return publicProfile(store.users.find((user) => user.uid === uid));
}

export function mockSubscribeAuthState(callback) {
  authListeners.add(callback);
  callback(getMockCurrentUser());
  return () => authListeners.delete(callback);
}

export async function mockRegisterUser({ email, password, name, role = 'client', status = 'active', createdByAdminId = '', observacoesInternas = '' }) {
  const store = readStore();
  const exists = store.users.some((user) => user.email === email);

  if (exists) {
    throw new Error('Email ja cadastrado no modo demo.');
  }

  const timestamp = nowIso();
  const uid = makeId('demo_user');
  const user = {
    id: uid,
    uid,
    email,
    password,
    nome: name,
    name,
    role,
    status,
    createdByAdminId,
    observacoesInternas,
    ativo: true,
    createdAt: timestamp,
    updatedAt: timestamp,
    lastLoginAt: '',
  };

  store.users.push(user);
  writeStore(store);
  notifyCollection('users');
  return publicProfile(user);
}

export async function mockListDocuments(collectionName) {
  const store = readStore();
  return sortCollection(store[collectionName] || []);
}

export function mockSubscribeToCollection(collectionName, _constraints, onData, onError) {
  try {
    const listener = { collectionName, onData };
    collectionListeners.add(listener);
    mockListDocuments(collectionName).then(onData).catch(onError);

    return () => collectionListeners.delete(listener);
  } catch (error) {
    onError?.(error);
    return () => {};
  }
}

export async function mockCreateDocument(collectionName, data) {
  const store = readStore();
  const timestamp = nowIso();
  const id = makeId(collectionName);
  const item = {
    id,
    ...data,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  store[collectionName] = [...(store[collectionName] || []), item];
  writeStore(store);
  notifyCollection(collectionName);
  return id;
}

export async function mockUpdateDocument(collectionName, id, data) {
  const store = readStore();
  const collection = store[collectionName] || [];
  const index = collection.findIndex((item) => item.id === id);

  if (index === -1) {
    throw new Error('Registro nao encontrado no modo demo.');
  }

  collection[index] = {
    ...collection[index],
    ...data,
    updatedAt: nowIso(),
  };
  store[collectionName] = collection;
  writeStore(store);
  notifyCollection(collectionName);
}

export async function mockDeleteDocument(collectionName, id) {
  const store = readStore();
  store[collectionName] = (store[collectionName] || []).filter((item) => item.id !== id);
  writeStore(store);
  notifyCollection(collectionName);
}

export function resetMockStore() {
  localStorage.removeItem(STORE_KEY);
  localStorage.removeItem(AUTH_KEY);
  readStore();
  notifyAuth();
  ['users', 'produtos', 'fornecedores', 'contas', 'subcontas', 'movimentacoes', 'parcelas', 'lancamentos', 'contas_pagar', 'contas_receber', 'estoque'].forEach(notifyCollection);
}
