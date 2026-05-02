# Banco de Dados

Este documento descreve as collections usadas no Cloud Firestore. Campos `createdAt` e `updatedAt` usam `serverTimestamp()` no Firebase e ISO string no modo demo.

## Padrao de seguranca

- Documentos operacionais possuem `userId`.
- Cliente (`role = client`) so pode ler e escrever documentos onde `userId == request.auth.uid`.
- Admin (`role = admin`) pode ler e escrever dados de clientes.
- Usuario com `status = pending` ou `blocked` nao acessa o sistema como cliente.

## users

Representa usuarios autenticados e clientes administrados.

Campos:

| Campo | Tipo | Obrigatorio | Descricao |
| --- | --- | --- | --- |
| `uid` | string | sim | UID do Firebase Auth |
| `nome` | string | sim | Nome do usuario ou cliente |
| `email` | string | sim | Email de login |
| `role` | string | sim | `admin` ou `client` |
| `status` | string | sim | `pending`, `active` ou `blocked` |
| `createdByAdminId` | string | nao | Admin que criou o cliente |
| `observacoesInternas` | string | nao | Notas internas do admin |
| `createdAt` | timestamp | sim | Criacao |
| `updatedAt` | timestamp | sim | Ultima alteracao |
| `lastLoginAt` | timestamp | nao | Ultimo acesso |

Regras:

- Apenas admin cria, libera ou bloqueia clientes.
- Cliente ativo pode acessar o sistema.
- Cliente pendente ou bloqueado e deslogado apos login.

Relacionamentos:

- `users.uid` e usado como `userId` nas demais collections.

## produtos

Produtos cadastrados por cliente.

Campos:

| Campo | Tipo | Obrigatorio | Descricao |
| --- | --- | --- | --- |
| `userId` | string | sim | Dono do produto |
| `codigo` | string | sim | Codigo unico por cliente |
| `nome` | string | sim | Nome do produto |
| `categoria` | string | nao | Categoria livre |
| `subcategoria` | string | nao | Subcategoria livre |
| `unidadeMedida` | string | nao | Unidade, ex: kg, sc, un |
| `controlaEstoque` | boolean | sim | Define se altera estoque |
| `estoqueAtual` | number | sim | Saldo atual |
| `quantidadeAtual` | number | nao | Campo legado equivalente ao saldo |
| `ativo` | boolean | sim | Produto ativo ou inativo |
| `createdAt` | timestamp | sim | Criacao |
| `updatedAt` | timestamp | sim | Ultima alteracao |

Regras:

- `codigo` nao pode duplicar para o mesmo `userId`.
- `nome` e obrigatorio.
- Saida de estoque nao pode deixar `estoqueAtual` negativo.

Relacionamentos:

- Referenciado por `movimentacoes.produtoId`.
- Referenciado por `parcelas.produtoId`.

## fornecedores

Fornecedores ou clientes vinculados aos lancamentos.

Campos:

| Campo | Tipo | Obrigatorio | Descricao |
| --- | --- | --- | --- |
| `userId` | string | sim | Dono do fornecedor |
| `nomeFantasia` | string | sim | Nome principal |
| `razaoSocial` | string | nao | Razao social |
| `cnpj` | string | nao | CNPJ normalizado |
| `inscricaoEstadual` | string | nao | Inscricao estadual |
| `telefone` | string | nao | Telefone |
| `email` | string | nao | Email |
| `endereco` | string | nao | Endereco |
| `descontoPadrao` | number | nao | Desconto padrao |
| `ativo` | boolean | sim | Ativo ou inativo |
| `createdAt` | timestamp | sim | Criacao |
| `updatedAt` | timestamp | sim | Ultima alteracao |

Regras:

- `nomeFantasia` e obrigatorio.
- CNPJ, quando informado, nao deve duplicar para o mesmo `userId`.

Relacionamentos:

- Referenciado por `movimentacoes.fornecedorId`.
- Referenciado por `parcelas.fornecedorId`.

## contas

Plano de contas principal.

Campos:

| Campo | Tipo | Obrigatorio | Descricao |
| --- | --- | --- | --- |
| `userId` | string | sim | Dono da conta |
| `nome` | string | sim | Nome da conta |
| `tipo` | string | sim | `despesa` ou `receita` |
| `ativo` | boolean | sim | Ativa ou inativa |
| `createdAt` | timestamp | sim | Criacao |
| `updatedAt` | timestamp | sim | Ultima alteracao |

Regras:

- `nome` e obrigatorio.
- `tipo` deve ser `despesa` ou `receita`.
- Consultas devem filtrar por `userId`.

Relacionamentos:

- Uma conta possui varias `subcontas`.
- Referenciada por `movimentacoes.contaId` e `parcelas.contaId`.

## subcontas

Classificacoes vinculadas a uma conta.

Campos:

| Campo | Tipo | Obrigatorio | Descricao |
| --- | --- | --- | --- |
| `userId` | string | sim | Dono da subconta |
| `contaId` | string | sim | Conta principal vinculada |
| `nome` | string | sim | Nome da subconta |
| `ativo` | boolean | sim | Ativa ou inativa |
| `createdAt` | timestamp | sim | Criacao |
| `updatedAt` | timestamp | sim | Ultima alteracao |

Regras:

- `contaId` e obrigatorio.
- `nome` e obrigatorio.
- Consultas devem filtrar por `userId` e `contaId`.
- Edicao preserva o vinculo com a conta original.

Relacionamentos:

- Pertence a `contas`.
- Referenciada por `movimentacoes.subContaId` e `parcelas.subContaId`.

## movimentacoes

Historico completo de lancamentos financeiros.

Campos:

| Campo | Tipo | Obrigatorio | Descricao |
| --- | --- | --- | --- |
| `userId` | string | sim | Dono da movimentacao |
| `produtoId` | string | sim | Produto vinculado |
| `produtoCodigo` | string | sim | Codigo do produto no momento do lancamento |
| `produtoNome` | string | sim | Nome do produto no momento do lancamento |
| `fornecedorId` | string | sim | Fornecedor/cliente vinculado |
| `fornecedorNome` | string | sim | Nome no momento do lancamento |
| `tipo` | string | sim | `despesa` ou `receita` |
| `centroCusto` | string | nao | Centro de custo |
| `responsavel` | string | nao | Responsavel |
| `tipoLancamento` | string | nao | Classificacao livre |
| `fazenda` | string | nao | Fazenda/local |
| `contaId` | string | sim | Conta principal |
| `conta` | string | sim | Nome da conta |
| `subContaId` | string | sim | Subconta |
| `subConta` | string | sim | Nome da subconta |
| `descricao` | string | nao | Descricao |
| `quantidade` | number | sim | Quantidade |
| `valorTotal` | number | sim | Valor total |
| `valorUnitario` | number | sim | Valor total dividido pela quantidade |
| `dataReferencia` | string | sim | Data principal `YYYY-MM-DD` |
| `dataEmissao` | string | nao | Data de emissao |
| `numeroNota` | string | nao | Numero da nota |
| `observacao` | string | nao | Observacao |
| `controlaEstoque` | boolean | sim | Define se altera estoque |
| `movimentacaoEstoque` | string | nao | `entrada` ou `saida` quando controla estoque |
| `saldoAnterior` | number | nao | Saldo antes da movimentacao |
| `saldoPosterior` | number | nao | Saldo depois da movimentacao |
| `possuiParcelamento` | boolean | sim | Se existe mais de uma parcela |
| `parcelas` | number | sim | Total de parcelas |
| `primeiroVencimento` | string | sim | Primeiro vencimento |
| `createdAt` | timestamp | sim | Criacao |
| `updatedAt` | timestamp | sim | Ultima alteracao |

Regras:

- `tipo` deve ser `despesa` ou `receita`.
- Produto, fornecedor, conta e subconta sao obrigatorios.
- `quantidade` deve ser maior que zero.
- `valorTotal` nao pode ser negativo.
- `valorUnitario` e calculado automaticamente.
- Movimentacao com estoque atualiza produto no mesmo fluxo.
- Sempre gera documentos em `parcelas`.

Relacionamentos:

- Pertence a `users`.
- Referencia `produtos`, `fornecedores`, `contas` e `subcontas`.
- Possui uma ou mais `parcelas`.

## parcelas

Base das contas a pagar e receber.

Campos:

| Campo | Tipo | Obrigatorio | Descricao |
| --- | --- | --- | --- |
| `userId` | string | sim | Dono da parcela |
| `movimentacaoId` | string | sim | Lancamento original |
| `tipo` | string | sim | `despesa` ou `receita` |
| `produtoId` | string | sim | Produto vinculado |
| `produtoNome` | string | sim | Produto no momento do lancamento |
| `fornecedorId` | string | sim | Fornecedor/cliente vinculado |
| `fornecedorNome` | string | sim | Nome no momento do lancamento |
| `contaId` | string | sim | Conta principal |
| `conta` | string | sim | Nome da conta |
| `subContaId` | string | sim | Subconta |
| `subConta` | string | sim | Nome da subconta |
| `numeroParcela` | number | sim | Numero da parcela |
| `totalParcelas` | number | sim | Total de parcelas |
| `valorParcela` | number | sim | Valor da parcela |
| `dataVencimento` | string | sim | Vencimento `YYYY-MM-DD` |
| `status` | string | sim | Status salvo: `aberta`, `paga` ou `recebido` |
| `dataPagamento` | string | nao | Data de pagamento para despesa |
| `dataRecebimento` | string | nao | Data de recebimento para receita |
| `createdAt` | timestamp | sim | Criacao |
| `updatedAt` | timestamp | sim | Ultima alteracao |

Regras:

- Se `tipo = despesa`, aparece em Contas a Pagar.
- Se `tipo = receita`, aparece em Contas a Receber.
- Status financeiro visual e calculado por vencimento.
- Marcar como pago preenche `dataPagamento`.
- Marcar como recebido preenche `dataRecebimento`.

Relacionamentos:

- Pertence a uma `movimentacoes`.
- Referencia produto, fornecedor, conta e subconta.
