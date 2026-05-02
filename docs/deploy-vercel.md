# Deploy na Vercel

Este guia prepara o Gestao Pro para deploy em producao usando Vercel.

## 1. Criar conta

1. Acesse a Vercel.
2. Crie uma conta ou entre com GitHub.
3. Autorize acesso aos repositorios desejados.

## 2. Conectar GitHub

1. Suba o projeto para um repositorio GitHub.
2. Na Vercel, clique em Add New Project.
3. Selecione o repositorio.
4. Clique em Import.

## 3. Configuracao do projeto

Use:

| Campo | Valor |
| --- | --- |
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

## 4. Variaveis obrigatorias

Configure em Project Settings > Environment Variables:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Ambientes recomendados:

- Production
- Preview
- Development, se usar `vercel env pull`

## 5. Deploy automatico

Depois de importar:

1. A Vercel instala dependencias.
2. Executa `npm run build`.
3. Publica o conteudo de `dist`.
4. Cada push na branch principal cria novo deploy.

## 6. Configurar dominio

Opcional:

1. Abra Project Settings > Domains.
2. Adicione o dominio.
3. Configure DNS conforme instrucoes da Vercel.

## 7. Checklist antes de publicar

- `npm run lint` passando
- `npm run build` passando
- `.env.local` nao versionado
- Variaveis `VITE_FIREBASE_*` cadastradas na Vercel
- Regras Firestore publicadas
- Usuario admin criado
- Login testado em producao
- Cliente ativo testado
- Cliente bloqueado testado

## 8. Problemas comuns

### Tela branca

Verificar:

- variaveis Firebase na Vercel
- console do navegador
- build local com `npm run build`
- se o projeto esta usando `dist` como output

### Login nao funciona

Verificar:

- Authentication email/senha ativo
- dominio autorizado no Firebase Auth
- documento `users/{uid}` existe
- `status = active`

### Permissao negada

Verificar:

- `userId` nos documentos
- role do usuario em `users`
- regras Firestore publicadas
- admin ou cliente selecionado corretamente

## 9. Rollback

Na Vercel:

1. Abra Deployments.
2. Escolha um deploy anterior estavel.
3. Clique em Promote to Production.
