# Gestao Pro

Sistema web de gestao economica, financeira e operacional para pequenos clientes que hoje controlam produtos, fornecedores, despesas, receitas e parcelas em planilhas.

## Stack

- React 18 + Vite
- JavaScript
- Tailwind CSS
- React Router
- Firebase Authentication
- Cloud Firestore
- Firebase Functions para criacao segura de clientes e recuperacao de senha por codigo
- Vercel para deploy

## Principais recursos

- Login com email e senha
- Perfis `admin` e `client`
- Admin com cadastro, liberacao, bloqueio e visao de cliente
- CRUD de produtos com codigo unico por cliente
- CRUD de fornecedores
- Plano de contas e subcontas
- Lancamentos financeiros com produto, fornecedor, conta, subconta, valor, vencimento e parcelas
- Contas a pagar e contas a receber baseadas em parcelas
- Status automatico por vencimento
- Historico de movimentacoes e historico de precos por produto
- Exportacao CSV
- Recuperacao de senha com codigo enviado por email via Cloud Function

## Estrutura

```txt
src/
  components/
  contexts/
  hooks/
  pages/
  services/
  styles/
  utils/

docs/
  README.md
  database.md
  design-system.md
  firebase-setup.md
  deploy-vercel.md
```

## Como rodar localmente

```bash
npm install
npm run dev
```

Abra o endereco exibido pelo Vite, normalmente `http://127.0.0.1:5173` ou `http://localhost:5173`.

## Configuracao Firebase

O Firebase e inicializado em [src/services/firebase.js](src/services/firebase.js) usando apenas variaveis de ambiente do Vite. Nao mantenha configuracao hardcoded no codigo.

Crie ou edite `.env.local` na raiz do projeto:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

Depois:

1. Preencha as variaveis `VITE_FIREBASE_*` com os dados do app web do Firebase.
2. Ative Authentication com email/senha.
3. Crie o Firestore.
4. Publique as regras em `firestore.rules`.
5. Publique as Functions para criacao e administracao de clientes.

Se alguma variavel estiver ausente, o app mostra no console:

```txt
Firebase nao configurado corretamente
```

Nesse caso, a aplicacao nao inicializa. O sistema depende de Firebase real.

Na Vercel, cadastre as mesmas variaveis em Project Settings > Environment Variables antes do deploy.

Guia completo: [docs/firebase-setup.md](docs/firebase-setup.md).

## Recuperacao de senha

O frontend usa `sendPasswordResetEmail(auth, email)`, do Firebase Auth.
Nao ha codigo numerico, Cloud Function ou SMTP proprio para esse fluxo.

## Deploy na Vercel

- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Variaveis: as mesmas `VITE_FIREBASE_*` usadas localmente

Guia completo: [docs/deploy-vercel.md](docs/deploy-vercel.md).

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Documentacao

- Visao do sistema: [docs/README.md](docs/README.md)
- Banco de dados: [docs/database.md](docs/database.md)
- Design system: [docs/design-system.md](docs/design-system.md)
- Firebase: [docs/firebase-setup.md](docs/firebase-setup.md)
- Vercel: [docs/deploy-vercel.md](docs/deploy-vercel.md)

## Versionamento

Arquivos sensiveis e gerados ficam fora do Git via `.gitignore`:

- `node_modules/`
- `dist/`
- `.env`
- `.env.local`
- logs e caches locais
