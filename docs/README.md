# Documentacao do Sistema

## Visao geral

O Gestao Pro e uma aplicacao web para substituir planilhas de controle economico, financeiro e operacional. O foco do MVP e permitir que cada cliente registre produtos, fornecedores, lancamentos, parcelas e historicos de forma simples, com isolamento de dados por usuario e uma visao administrativa para consultores.

Principais funcionalidades:

- autenticacao por email e senha
- perfis `admin` e `client`
- cadastro de clientes pelo admin
- produtos com codigo unico por cliente
- fornecedores com controle de duplicidade por CNPJ
- plano de contas e subcontas
- lancamentos de despesas e receitas
- geracao automatica de parcelas
- contas a pagar e contas a receber
- historico de movimentacoes
- historico de preco por produto
- exportacao CSV
- recuperacao de senha por link nativo do Firebase Auth

## Estrutura do sistema

### Frontend

- React com Vite
- React Router para navegacao
- Tailwind CSS para estilos
- Componentes reutilizaveis em `src/components`
- Paginas em `src/pages`
- Contextos globais em `src/contexts`
- Hooks em `src/hooks`

### Backend

- Firebase Authentication para login
- Cloud Firestore para persistencia
- Firebase Functions para criacao segura de usuarios clientes
- Regras Firestore para isolamento por `userId` e permissao de admin

### Autenticacao

O login usa Firebase Auth. Sem as variaveis `VITE_FIREBASE_*` configuradas, a aplicacao nao inicializa e exibe erro claro no console.

Fluxo:

1. Usuario informa email e senha.
2. App autentica no Firebase Auth.
3. App busca `users/{uid}`.
4. Se `role = admin`, libera area administrativa.
5. Se `role = client` e `status = active`, libera area do cliente.
6. Se `status = pending` ou `blocked`, bloqueia acesso.
7. Se `mustChangePassword = true`, redireciona obrigatoriamente para `/change-password`.

Recuperacao de senha:

1. Usuario clica em "Esqueci minha senha".
2. App chama `sendPasswordResetEmail(auth, email)`.
3. Firebase Auth envia o link nativo de redefinicao de senha.
4. Usuario redefine a senha pelo fluxo seguro do Firebase.

Regras:

- a tela nunca revela se o email existe
- nao existe codigo numerico salvo no Firestore
- nao ha envio SMTP proprio nem Cloud Function para recuperar senha
- a redefinicao usa o provedor nativo do Firebase Auth

Troca obrigatoria de senha:

- Admin cria cliente com senha temporaria.
- O documento `users/{uid}` recebe `mustChangePassword = true`.
- No primeiro login ativo, o cliente fica bloqueado nas demais rotas ate alterar a senha.
- A tela `/change-password` reautentica com a senha atual e atualiza a senha via Firebase Auth.
- A senha nunca e salva no Firestore.
- Apos sucesso, `mustChangePassword` vira `false` e `passwordChangedAt` e preenchido.

### Banco de dados

O Firestore armazena as collections:

- `users`
- `produtos`
- `fornecedores`
- `movimentacoes`
- `parcelas`
- `contas`
- `subcontas`

Todos os documentos operacionais possuem `userId`, exceto o proprio documento de usuario em `users`.

## Modulos

### Produtos

Permite cadastrar, editar, inativar e listar produtos.

Principais campos:

- `codigo`
- `nome`
- `categoria`
- `subcategoria`
- `unidadeMedida`
- `contaPadraoId`
- `contaPadraoNome`
- `subcontaPadraoId`
- `subcontaPadraoNome`
- `controlaEstoque`
- `estoqueAtual`
- `ativo`

Regras:

- `codigo` e obrigatorio
- `nome` e obrigatorio
- `codigo` deve ser unico por `userId`
- conta e subconta padrao sao opcionais e servem como sugestao no lancamento
- subconta padrao deve pertencer a conta padrao
- cliente acessa apenas seus produtos
- admin pode operar produtos do cliente selecionado

### Fornecedores

Permite cadastrar, editar, inativar e listar fornecedores.

Principais campos:

- `nomeFantasia`
- `razaoSocial`
- `cnpj`
- `inscricaoEstadual`
- `telefone`
- `email`
- `endereco`
- `descontoPadrao`
- `ativo`

Regras:

- `nomeFantasia` e obrigatorio
- CNPJ, quando informado, nao deve duplicar para o mesmo `userId`
- cliente acessa apenas seus fornecedores

### Lancamentos

Formulario principal do sistema. Registra despesas e receitas vinculadas a produto, fornecedor, conta, subconta e parcelas.

Principais campos:

- `tipo`
- `produtoId`
- `fornecedorId`
- `contaId`
- `subContaId`
- `quantidade`
- `valorTotal`
- `valorUnitario`
- `dataReferencia`
- `dataEmissao`
- `primeiroVencimento`
- `parcelas`
- `observacao`

Regras:

- produto e obrigatorio
- fornecedor/cliente e obrigatorio
- conta e subconta sao obrigatorias
- `valorUnitario = valorTotal / quantidade`
- se `controlaEstoque = true`, atualiza saldo do produto
- saida de estoque nao pode deixar saldo negativo
- sempre gera parcelas: uma unica parcela quando nao ha parcelamento

### Contas a pagar

Lista parcelas de movimentacoes do tipo `despesa`.

Campos exibidos:

- fornecedor
- produto
- conta
- subconta
- valor
- vencimento
- parcela
- status

Regras:

- `pago` quando existe `dataPagamento` ou status salvo `paga`
- `vencido` quando `dataVencimento < hoje` e nao esta pago
- `aberto` nos demais casos

### Contas a receber

Lista parcelas de movimentacoes do tipo `receita`.

Campos exibidos:

- cliente/fornecedor
- produto
- conta
- subconta
- valor
- vencimento
- parcela
- status

Regras:

- `recebido` quando existe `dataRecebimento` ou status salvo `recebido`
- `atrasado` quando `dataVencimento < hoje` e nao esta recebido
- `aberto` nos demais casos

### Parcelas

Centraliza o controle de vencimentos gerados pelos lancamentos.

Principais campos:

- `movimentacaoId`
- `tipo`
- `valorParcela`
- `dataVencimento`
- `status`
- `dataPagamento`
- `dataRecebimento`

Regras:

- parcelas sao vinculadas ao lancamento original
- valor total e dividido entre parcelas
- vencimentos mensais a partir do primeiro vencimento
- status visual e sempre recalculado por data

### Historico

Lista as movimentacoes registradas pelo cliente.

Campos exibidos:

- data
- produto
- fornecedor
- tipo
- conta
- subconta
- status financeiro
- vencimento
- quantidade
- valor total
- valor unitario
- parcelas

Regras:

- historico vem da collection `movimentacoes`
- status financeiro e calculado a partir das parcelas vinculadas
- filtros respeitam o `userId` efetivo

### Historico de precos

Mostra a evolucao do valor unitario por produto com base nas movimentacoes.

Campos exibidos:

- data
- fornecedor
- quantidade
- valor total
- valor unitario
- nota
- observacao

Regras:

- preco nao fica fixo no produto
- preco vem de cada movimentacao
- filtra por produto selecionado

### Plano de contas

Permite cadastrar contas e subcontas para classificar despesas e receitas.

Contas:

- `nome`
- `tipo`
- `ativo`

Subcontas:

- `contaId`
- `nome`
- `ativo`

Regras:

- contas pertencem ao `userId`
- subcontas pertencem ao `userId` e a uma `contaId`
- subcontas exibidas sao filtradas pela conta selecionada
- ao editar subconta, o vinculo com a conta original e preservado

### Admin

Area exclusiva para `role = admin`.

Funcionalidades:

- listar clientes
- criar cliente
- criar cliente com senha temporaria
- editar status do cliente
- liberar acesso
- bloquear acesso
- selecionar cliente
- entrar na visao do cliente
- consultar visao macro

Regras:

- admin pode ler e escrever dados de qualquer cliente
- cliente comum nunca ve dados de outro cliente
- admin em visao de cliente usa `effectiveUserId = selectedClientId`
- clientes criados pelo admin devem trocar a senha temporaria no primeiro acesso

### Recuperacao de senha

Permite redefinir a senha quando o usuario esquece o acesso.

Regras:

- usa `sendPasswordResetEmail(auth, email)`
- nao depende de Cloud Function
- nao depende de SMTP externo
- resposta da solicitacao e generica para nao revelar cadastro de email
