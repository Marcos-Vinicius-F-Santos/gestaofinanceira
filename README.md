# Gestao Pro

Sistema web de gestao economica, financeira e operacional para pequenos clientes que hoje controlam produtos, fornecedores, despesas, receitas e parcelas em planilhas.

## Stack

- React 18 + Vite
- JavaScript
- Tailwind CSS
- React Router
- Firebase Authentication
- Cloud Firestore
- Firebase Functions preparada para criacao segura de clientes pelo admin
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
- Modo demo local sem Firebase configurado

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

## Modo demo

Se as variaveis `VITE_FIREBASE_*` nao estiverem preenchidas, o app usa `localStorage` para permitir testes sem Firebase.

- Admin: `admin@teste.com` / `123456`
- Cliente: `cliente@teste.com` / `123456`

## Configurar Firebase

1. Copie `.env.example` para `.env.local`.
2. Preencha as variaveis `VITE_FIREBASE_*`.
3. Ative Authentication com email/senha.
4. Crie o Firestore.
5. Publique as regras em `firestore.rules`.

Guia completo: [docs/firebase-setup.md](docs/firebase-setup.md).

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
