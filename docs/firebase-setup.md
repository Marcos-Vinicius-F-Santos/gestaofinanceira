# Configuracao Firebase

Este guia mostra como configurar Firebase Authentication, Firestore e variaveis de ambiente para o Gestao Pro.

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
  "createdByAdminId": "",
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp",
  "lastLoginAt": null
}
```

### Via script ou Cloud Function

Para producao, o cadastro de clientes pelo admin deve criar usuario no Firebase Auth por backend/Cloud Function. O frontend ja esta preparado para chamar uma callable function `createClientUser()`.

## 8. Collections esperadas

- `users`
- `produtos`
- `fornecedores`
- `movimentacoes`
- `parcelas`
- `contas`
- `subcontas`

Veja detalhes em [database.md](database.md).

## 9. Teste local

Com `.env.local` configurado:

```bash
npm run dev
```

Se as variaveis estiverem ausentes ou com placeholders, o app entra em modo demo local.

## 10. Checklist de seguranca

- Authentication email/senha ativo
- Firestore em modo producao
- Regras publicadas
- Primeiro admin criado
- `.env.local` fora do Git
- Clientes com `status = active` para acessar
- Clientes pendentes ou bloqueados testados
