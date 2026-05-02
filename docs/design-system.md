# Design System

Este guia define os padroes visuais basicos do Gestao Pro. A aplicacao usa Tailwind CSS e classes utilitarias, com alguns componentes compartilhados em `src/components/shared`.

## Principios

- Clareza antes de decoracao
- Telas densas, mas legiveis
- Acoes principais sempre evidentes
- Estados financeiros com cores semanticas
- Mobile-first com toque minimo de 44px

## Cores

| Token | Uso | Valor |
| --- | --- | --- |
| `primary` | Acoes principais, links ativos | `#2563eb` |
| `primaryHover` | Hover do botao primario | `#1d4ed8` |
| `secondary` | Acoes secundarias, bordas neutras | `#64748b` |
| `success` | Pago, recebido, sucesso | `#059669` |
| `danger` | Erro, despesa, exclusao | `#dc2626` |
| `warning` | Vencido, atrasado, pendente | `#d97706` |
| `background` | Fundo da aplicacao | `#f1f5f9` |
| `surface` | Paineis e cards | `#ffffff` |
| `text` | Texto principal | `#17212b` |
| `mutedText` | Texto secundario | `#64748b` |

Referencia opcional em codigo: `src/styles/theme.js`.

## Tipografia

- Fonte padrao: fonte do sistema via navegador
- Texto base: `text-sm` em desktop e `text-base` em inputs mobile
- Titulos de pagina: `text-2xl` ou equivalente
- Labels: caixa alta, pequeno, com peso forte

## Espacamento

Padroes:

- espacamento entre secoes: `space-y-4` em mobile, `space-y-6` em telas maiores
- padding de painel: `p-3` em mobile, `p-4` em desktop
- gap de grids: `gap-3` ou `gap-4`
- raio de borda: `rounded-md` para controles e `rounded-lg` para paineis

## Botoes

Todos os botoes devem ter altura minima de toque:

- `min-h-11`
- icone + texto quando a acao precisa de contexto
- somente icone em acoes repetidas de tabela, sempre com `aria-label`

### Primary Button

Uso:

- criar registro
- salvar formulario
- acao principal da pagina

Visual:

- fundo `primary`
- texto branco
- hover `primaryHover`
- foco com anel azul claro
- disabled com opacidade reduzida

Classe atual:

```txt
btn-primary
```

### Secondary Button

Uso:

- cancelar
- exportar
- limpar filtros
- acoes de suporte

Visual:

- fundo branco
- borda cinza
- texto neutro
- hover cinza claro

Classe atual:

```txt
btn-secondary
```

### Ghost Button

Uso recomendado:

- acoes discretas futuras
- links internos com baixa prioridade

Visual sugerido:

- fundo transparente
- texto neutro ou azul
- hover em fundo sutil
- sem sombra

## Inputs

Padrao atual:

- largura total
- altura minima `min-h-11`
- borda `slate-300`
- fundo branco
- foco com borda azul e ring azul claro
- placeholder em cinza

Estados:

- erro: borda vermelha e mensagem abaixo do campo
- disabled: opacidade reduzida e cursor padrao
- readonly: fundo neutro quando necessario

## Formularios

Boas praticas:

- agrupar campos por contexto
- usar uma coluna em mobile
- usar grid em desktop
- manter labels curtas
- exibir feedback de erro no topo e, quando possivel, no campo

## Tabelas

Padrao visual:

- header com fundo `slate-50`
- labels em uppercase pequeno
- linhas com zebra leve
- hover azul claro
- scroll horizontal em telas pequenas
- acoes alinhadas na ultima coluna

Acoes de tabela usam:

```txt
table-action
```

## Status financeiros

| Status | Cor | Uso |
| --- | --- | --- |
| `pago` | verde | Despesa quitada |
| `recebido` | verde | Receita recebida |
| `aberto` | amarelo/azul conforme contexto | Ainda no prazo |
| `vencido` | vermelho/amarelo forte | Despesa atrasada |
| `atrasado` | vermelho/amarelo forte | Receita atrasada |

Regra de negocio:

- Status visual deve ser recalculado com base em vencimento e datas de pagamento/recebimento.
- Nao confiar apenas no status salvo.

## Badges

Badges sao usados para:

- tipo de lancamento (`receita`, `despesa`)
- status financeiro
- status de usuario (`active`, `pending`, `blocked`)
- status de cadastro (`ativo`, `inativo`)

Componente atual:

```txt
src/components/shared/StatusBadge.jsx
```

## Paineis e cards

Usar paineis para agrupar conteudo operacional:

```txt
panel
```

Caracteristicas:

- fundo branco
- borda clara
- sombra suave
- raio consistente

Evitar cards dentro de cards.

## Responsividade

Padrao:

- mobile ate 768px
- tablet ate 1024px
- sidebar vira drawer no mobile
- tabelas usam scroll horizontal
- botoes ficam full width quando necessario
- formularios usam coluna unica em mobile

## Componentes compartilhados

- `Button`
- `Card`
- `Modal`
- `Alert`
- `EmptyState`
- `FormField`
- `LoadingState`
- `PageHeader`
- `StatusBadge`

Novos componentes devem seguir esses padroes antes de criar estilos novos.
