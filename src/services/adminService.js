import { httpsCallable } from 'firebase/functions';
import { createDocument, listDocuments, updateDocument } from './firestoreService';
import { functions, isFirebaseConfigured } from './firebase';
import { getMovimentacoes } from './movimentacaoService';
import { getParcelas, getStatusContaPagar, getStatusContaReceber } from './parcelaService';
import { mockRegisterUser } from './mockService';

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

export async function createClientUser({ nome, email, password, status = 'pending', createdByAdminId = '' }) {
  if (!nome?.trim()) throw new Error('Informe o nome do cliente.');
  if (!email?.trim()) throw new Error('Informe o email do cliente.');
  if (!password?.trim()) throw new Error('Informe a senha temporaria.');

  if (!isFirebaseConfigured) {
    return mockRegisterUser({
      email,
      password,
      name: nome,
      role: 'client',
      status,
      createdByAdminId,
    });
  }

  // Esta callable deve ser publicada como Cloud Function usando Admin SDK.
  // Ela cria o usuario no Firebase Auth e grava users/{uid} com os campos do cliente.
  const callable = httpsCallable(functions, 'createClientUser');
  const result = await callable({ nome, email, password, status, createdByAdminId });
  return result.data;
}

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

export const getClientData = async () => ({ produtos: [], fornecedores: [], movimentacoes: [], parcelas: [] });
export const create = createDocument;
