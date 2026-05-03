import { getFunctions, httpsCallable } from 'firebase/functions';
import { createDocument, listDocuments, updateDocument } from './firestoreService';
import { app } from './firebase';
import { getMovimentacoes } from './movimentacaoService';
import { getParcelas, getStatusContaPagar, getStatusContaReceber } from './parcelaService';

function normalizeClient(user) {
  return {
    ...user,
    uid: user.uid || user.id,
    nome: user.nome || user.name || user.email,
    role: user.role === 'user' ? 'client' : user.role,
    status: user.status || (user.ativo === false ? 'blocked' : 'active'),
  };
}

export async function getUsers() {
  const users = await listDocuments('users');
  return users.map(normalizeClient).sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || '')));
}

export async function getClients() {
  const users = await getUsers();
  return users.filter((user) => user.role === 'client');
}

function mapCreateClientError(error) {
  if (error.code === 'functions/permission-denied' || error.code === 'permission-denied') {
    return 'Voce nao tem permissao para criar clientes.';
  }

  if (error.code === 'functions/unauthenticated' || error.code === 'unauthenticated') {
    return 'Sua sessao expirou. Faca login novamente.';
  }

  if (error.code === 'functions/already-exists' || error.code === 'already-exists') {
    return 'Este email ja esta cadastrado.';
  }

  if (error.code === 'functions/invalid-argument' || error.code === 'invalid-argument') {
    return error.message || 'Confira os dados do cliente.';
  }

  return 'Nao foi possivel criar o cliente agora.';
}

export async function createClientUserCallable({ nome, email, password, status = 'pending', createdByAdminId = '' }) {
  if (!nome?.trim()) throw new Error('Informe o nome do cliente.');
  if (!email?.trim()) throw new Error('Informe o email do cliente.');
  if (!password?.trim()) throw new Error('Informe a senha temporaria.');

  try {
    const functions = getFunctions(app, 'southamerica-east1');
    const callable = httpsCallable(functions, 'createClientUser');
    const result = await callable({
      nome,
      email,
      password,
      status,
      createdByAdminId,
    });

    return result.data;
  } catch (error) {
    throw new Error(mapCreateClientError(error));
  }
}

export const createClientUser = createClientUserCallable;

async function findUserDocumentId(uid) {
  const users = await listDocuments('users');
  const user = users.find((item) => item.uid === uid || item.id === uid);
  return user?.id || uid;
}

export async function updateClientUser(uid, payload) {
  const id = await findUserDocumentId(uid);
  return updateDocument('users', id, {
    nome: String(payload.nome || '').trim(),
    status: payload.status,
    observacoesInternas: String(payload.observacoesInternas || '').trim(),
    ativo: payload.status === 'active',
  });
}

export async function updateClientStatus(uid, status) {
  const id = await findUserDocumentId(uid);
  return updateDocument('users', id, {
    status,
    ativo: status === 'active',
  });
}

export async function getMacroData(adminScope = {}) {
  const scope = { ...adminScope, isAdmin: true };
  const [clients, movimentacoes, parcelas] = await Promise.all([
    getClients(),
    getMovimentacoes(scope),
    getParcelas(scope),
  ]);

  const rows = clients.map((client) => {
    const clientParcelas = parcelas.filter((parcela) => parcela.userId === client.uid);
    const pagarAberto = clientParcelas
      .filter((parcela) => parcela.tipo === 'despesa' && getStatusContaPagar(parcela) === 'aberto')
      .reduce((sum, parcela) => sum + Number(parcela.valorParcela || 0), 0);
    const receberAberto = clientParcelas
      .filter((parcela) => parcela.tipo === 'receita' && getStatusContaReceber(parcela) === 'aberto')
      .reduce((sum, parcela) => sum + Number(parcela.valorParcela || 0), 0);
    const vencido = clientParcelas
      .filter((parcela) => ['vencido', 'atrasado'].includes(parcela.statusCalculado))
      .reduce((sum, parcela) => sum + Number(parcela.valorParcela || 0), 0);

    return {
      userId: client.uid,
      nome: client.nome,
      email: client.email,
      status: client.status,
      movimentacoes: movimentacoes.filter((movement) => movement.userId === client.uid).length,
      pagarAberto,
      receberAberto,
      vencido,
    };
  });

  return {
    totalAtivos: clients.filter((client) => client.status === 'active').length,
    totalBloqueados: clients.filter((client) => client.status === 'blocked').length,
    totalPendentes: clients.filter((client) => client.status === 'pending').length,
    totalMovimentacoes: movimentacoes.length,
    rows,
  };
}

export const create = createDocument;
