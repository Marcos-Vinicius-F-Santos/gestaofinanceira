# Configuracao Firebase

Este guia mostra como configurar Firebase Authentication, Firestore, Cloud Functions, email transacional e variaveis de ambiente para o Gestao Pro.

## 1. Criar projeto Firebase

1. Acesse o console do Firebase.
2. Clique em criar projeto.
3. Informe o nome do projeto.
4. Analytics e opcional para o MVP.
5. Finalize a criacao.

## 2. Ativar Authentication

1. No menu lateral, abra Authentication.
2. Clique em Get started.
3. Va em Sign-in method.
4. Ative Email/Password.
5. Salve.

## 3. Criar Firestore

1. No menu lateral, abra Firestore Database.
2. Clique em Create database.
3. Escolha o modo de producao.
4. Escolha a regiao mais adequada.
5. Finalize.

## 4. Configurar regras

O projeto inclui o arquivo:

```txt
firestore.rules
```

Publique essas regras no Firebase. Elas protegem dados por `userId` e liberam acesso amplo apenas para usuarios com `role = admin`.

Resumo:

- cliente autenticado e ativo so acessa documentos com `userId` igual ao proprio UID
- admin acessa documentos de todos os clientes
- cliente pendente ou bloqueado nao deve operar dados
- cliente pode atualizar no proprio `users/{uid}` apenas metadados de login e troca de senha
- `passwordResetCodes` nao permite acesso direto pelo frontend
- nenhuma collection deve usar `allow read, write: if true`

## 5. Adicionar app web

1. No Firebase, abra Project settings.
2. Em Your apps, clique no icone Web.
3. Informe um nome para o app.
4. Copie o objeto de configuracao gerado.

## 6. Variaveis de ambiente

Copie:

```bash
cp .env.example .env.local
```

Preencha:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Observacoes:

- Nunca versionar `.env` ou `.env.local`.
- `.env.example` deve ficar versionado como referencia.
- Variaveis de frontend em Vite precisam comecar com `VITE_`.

## 7. Criar primeiro admin

Existem duas formas.

### Manual pelo Firebase

1. Crie um usuario em Authentication.
2. Copie o UID.
3. Crie um documento em `users/{uid}`.

Exemplo:

```json
{
  "uid": "UID_DO_AUTH",
  "nome": "Administrador",
  "email": "admin@empresa.com",
  "role": "admin",
  "status": "active",
  "mustChangePassword": false,
  "createdByAdminId": "",
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp",
  "firstLoginAt": null,
  "lastLoginAt": null,
  "passwordChangedAt": null
}
```

### Via script ou Cloud Function

Para producao, o cadastro de clientes pelo admin deve criar usuario no Firebase Auth por backend/Cloud Function. O frontend ja esta preparado para chamar uma callable function `createClientUser()`.

A callable deve:

- criar usuario no Firebase Auth com a senha temporaria
- criar `users/{uid}`
- salvar `role = client`
- salvar `status` informado pelo admin
- salvar `mustChangePassword = true`
- nao salvar a senha temporaria no Firestore

## 8. Troca obrigatoria de senha

Quando `mustChangePassword = true`:

1. Usuario faz login com a senha temporaria.
2. App valida `status`.
3. Se `status = active`, redireciona para `/change-password`.
4. A tela reautentica usando `reauthenticateWithCredential()`.
5. Atualiza senha com `updatePassword()`.
6. Atualiza `users/{uid}`:
   - `mustChangePassword = false`
   - `passwordChangedAt = serverTimestamp()`
   - `firstLoginAt = serverTimestamp()`, se ainda nao existir
   - `updatedAt = serverTimestamp()`

Clientes `pending` ou `blocked` nao conseguem chegar a tela de troca de senha.

## 9. Recuperacao de senha por codigo

O app possui a rota:

```txt
/forgot-password
```

Fluxo:

1. Usuario informa email.
2. Frontend chama `requestPasswordResetCode(email)`.
3. Cloud Function busca o usuario pelo email usando Admin SDK.
4. Se existir, gera codigo de 6 digitos.
5. Salva apenas `codeHash` em `passwordResetCodes`.
6. Define expiracao de 10 minutos e tentativas em zero.
7. Envia o codigo por email.
8. Usuario informa codigo, nova senha e confirmacao.
9. Frontend chama `verifyPasswordResetCode(email, code, newPassword)`.
10. Cloud Function valida codigo, expiracao e tentativas.
11. Senha e alterada com `admin.auth().updateUser()`.
12. Codigo e marcado como usado.

Seguranca:

- resposta da solicitacao e generica para nao revelar se o email existe.
- codigo puro nao e salvo no banco.
- limite de 5 tentativas.
- reenvio bloqueado por 60 segundos.
- senha nunca passa por Firestore.
- credenciais de email ficam somente nas Cloud Functions.

## 10. Configurar Cloud Functions

Instale dependencias das Functions:

```bash
cd functions
npm install
```

Copie o exemplo de ambiente:

```bash
cp .env.example .env
```

Preencha:

```env
EMAIL_HOST=
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=
EMAIL_SECURE=false
PASSWORD_RESET_HASH_SECRET=
FUNCTIONS_REGION=southamerica-east1
```

Variaveis:

- `EMAIL_HOST`: servidor SMTP.
- `EMAIL_PORT`: porta SMTP, normalmente `587` ou `465`.
- `EMAIL_USER`: usuario SMTP.
- `EMAIL_PASS`: senha SMTP.
- `EMAIL_FROM`: remetente dos emails.
- `EMAIL_SECURE`: `true` para SMTP seguro direto, comum na porta `465`.
- `PASSWORD_RESET_HASH_SECRET`: segredo forte para HMAC do codigo.
- `FUNCTIONS_REGION`: regiao das Functions.

Publique:

```bash
firebase deploy --only functions,firestore:rules
```

Functions criadas:

- `createClientUser`
- `requestPasswordResetCode`
- `verifyPasswordResetCode`

## 11. Collections esperadas

- `users`
- `produtos`
- `fornecedores`
- `movimentacoes`
- `parcelas`
- `contas`
- `subcontas`
- `passwordResetCodes`

Veja detalhes em [database.md](database.md).

## 12. Teste local

Com `.env.local` configurado:

```bash
npm run dev
```

Se as variaveis estiverem ausentes ou com placeholders, a aplicacao nao inicializa e mostra o erro:

```txt
Firebase nao configurado corretamente
```

Nao existe fallback local de dados. Todos os dados devem vir do Firebase real.

## 13. Checklist de seguranca

- Authentication email/senha ativo
- Firestore em modo producao
- Regras publicadas
- Primeiro admin criado
- `.env.local` fora do Git
- Clientes com `status = active` para acessar
- Cliente novo troca senha temporaria no primeiro login
- Clientes pendentes ou bloqueados testados
- Functions publicadas
- SMTP configurado somente no ambiente das Functions
- `PASSWORD_RESET_HASH_SECRET` forte e fora do frontend
- Collection `passwordResetCodes` bloqueada nas regras
