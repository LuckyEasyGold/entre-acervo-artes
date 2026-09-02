# Plano de Reestruturação — ENTRE Acervo de Artes v3

## Visão geral

Reformular todo o projeto seguindo a lógica de **galeria de artes contemporânea**, com hierarquia clara de papéis e fluxo de navegação intuitivo.

## Conceito

- **Alunos = Artistas** (protagonistas)
- **Orientadores = Especialistas, curadores e críticos** (autoridade curatorial)
- **Galeria = protagonista visual** (não um apêndice)
- **Acervo = memórias e produção técnica** (TCC, artigos, livros, editoriais)

## Mudança de papéis e responsabilidades

### Aluno (Artista)
- Cria perfil com portfólio
- Posta obras em qualquer categoria
- Pode postar vídeos via YouTube (link) ou outras mídias via Supabase Storage
- Pode tornar postagens **públicas** ou **privadas**
- Pode **solicitar orientação** para uma obra específica
- Visualiza próprias obras privadas no seu perfil

### Orientador (Especialista/Curador/Crítico)
- Cria perfil de especialista
- Lista área de atuação e disciplinas
- Recebe solicitações de orientação dos alunos
- Pode **aprovar/rejeitar** orientações
- Faz **curadoria** de obras para destaque na galeria
- Pode escrever críticas textuais sobre obras
- Adiciona produções acadêmicas (livros, artigos, TCCs)

## Nova arquitetura de páginas

### 1. `index.html` (renomear para `welcome.html`) — Tela de Boas-Vindas / Login
- **Tela única que serve como boas-vindas E login/cadastro**
- Background artístico (galeria com obras em destaque desfocadas)
- Mensagem de boas-vindas
- Botões: "Entrar" | "Criar conta"
- Modal/tabs para login e cadastro
- Após login → redireciona para `home.html`
- **Substitui o `login.html` atual**

### 2. `home.html` (nova home logada) — Hub central
- **Fundo artístico discreto** (sem vídeo pesado, sem orbs exagerados)
- **Preview de obras em destaque** (modo aleatório, seleção rotativa de 6-8 obras do acervo)
- Header com nome do usuário, link para perfil, logout
- Cards/seções de acesso rápido (layout clean, com ícones discretos):
  - **Galeria** (link para `galeria.html`)
  - **Alunos** (link para `alunos.html`)
  - **Orientadores** (link para `orientadores.html`)
  - **Acervo** (link para `acervo.html`)
  - **Meu Perfil** (link para `perfil.html` — apenas para usuário logado)
- Manter o modal de perfil de cada usuário (mantém o que já existe, mas com layout melhorado)
- Logout

### 3. `galeria.html` (reformulada) — O coração do site
**Esta é a página mais importante, com layout clean e foco total nas obras**

- Hero minimalista (apenas título e busca)
- Grid masonry **clean** com obras em destaque
- Filtros laterais (sticky):
  - Por categoria (foto, pintura, escultura, vídeo, dança, etc.)
  - Por orientador
  - Por período
- Lightbox ao clicar na obra:
  - Imagem/vídeo em destaque
  - Metadados (título, autor, orientador, ano, técnica)
  - Descrição do autor
  - **Crítica do orientador** (se houver)
  - Botão "Solicitar orientação" (se aluno logado e obra for de outro autor)
  - Botão "Ver perfil do artista"
- Remover: carrossel leque, modo surpresa, seções dispersas

### 4. `alunos.html` — Lista de Artistas
- Grid de cards com foto, nome, curso
- Filtros por período/curso
- Clique abre perfil público do aluno

### 5. `orientadores.html` — Lista de Especialistas
- Grid de cards com foto, nome, área, título
- Filtros por área de atuação
- Clique abre perfil público do orientador

### 6. `acervo.html` (reformulado) — Publicações Técnicas
- Categorias específicas: TCC, Artigo, Livro, Editorial, PDF
- Filtros por tipo, autor, orientador
- Lista de documentos com preview

### 7. `perfil.html` (nova) — Perfil do usuário logado
- **Privado** — mostra tudo do usuário (público + privado)
- Seções:
  - **Cabeçalho**: foto, nome, tipo (artista/especialista), bio
  - **Estatísticas**: obras publicadas, visualizações, downloads
  - **Meu Acervo**: lista de obras com status (público/privado/rascunho)
  - **Publicar Nova Obra** (formulário)
  - **Produções Acadêmicas** (para orientadores)
  - **Solicitações de Orientação** (recebidas/feitas)
  - **Orientações em Andamento** (para orientadores)
  - **Editar Perfil**
- Botão de logout

### 8. `obra.html` (nova) — Página individual de obra
- Visualização em tela cheia
- Informações completas
- Crítica do orientador
- Link para o perfil do artista
- Botão "Solicitar orientação" (se aplicável)

### 9. `admin.html` (futura) — Painel administrativo
- Gestão de usuários
- Moderação
- Estatísticas globais

## Mudanças no banco de dados

### Novas tabelas

#### `work_requests` (solicitações de orientação)
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid PK | Identificador |
| work_id | uuid FK -> works | Obra a ser orientada |
| student_id | uuid FK -> artists | Aluno solicitante |
| advisor_id | uuid FK -> artists | Orientador solicitado |
| message | text | Mensagem do aluno |
| status | text | `pending`, `approved`, `rejected` |
| created_at | timestamptz | Data |

#### `critiques` (críticas dos orientadores)
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid PK | Identificador |
| work_id | uuid FK -> works | Obra avaliada |
| advisor_id | uuid FK -> artists | Orientador crítico |
| content | text | Texto da crítica |
| created_at | timestamptz | Data |

### Modificações em `works`
- Adicionar `visibility` (text): `public`, `private`, `unlisted` (padrão: `public`)
- Adicionar `youtube_url` (text): link do YouTube para vídeos
- Adicionar `advisor_id` (uuid FK): orientador responsável (quando aplicável)

### Modificações em `artists`
- Adicionar `username` (text unique): identificador único
- Adicionar `is_curator` (boolean): flag para orientadores com permissão de curadoria

## Mudanças no design/visual

### Princípios
- **Clean**: muito espaço em branco, tipografia hierárquica
- **Galeria-first**: obras são protagonistas, sem hero decorativo exagerado
- **Fundo da home**: preview aleatório de obras em grid suave (sem vídeo, sem orbs coloridos)
- **Cores**: manter branco, lilás, azul safira

### Modal de perfil — versão melhorada

**Problema atual:** o modal do orientador fica amontoado, com muitas seções empilhadas (currículo, redes sociais, produções acadêmicas, obras, alunos orientados). Tudo compete pela atenção.

**Solução: abas/tabs dentro do modal**

- **Aba 1 — Sobre** (padrão)
  - Foto grande + nome + título/área
  - Bio curta
  - Redes sociais (ícones pequenos, sem duplicar em lista)
  - Botão "Seguir" / "Solicitar orientação"

- **Aba 2 — Currículo**
  - Currículo completo formatado
  - Disciplinas que leciona
  - Área de atuação (em destaque)

- **Aba 3 — Produções Acadêmicas**
  - Lista de livros, artigos, TCCs
  - Filtros por tipo

- **Aba 4 — Alunos Orientados**
  - Grid de cards dos alunos
  - Quantidade de obras por aluno
  - Clique leva ao perfil do aluno

- **Aba 5 — Acervo** (igual para todos)
  - Grid masonry das obras do orientador
  - Lightbox ao clicar

**Para alunos:** abas "Sobre" e "Acervo" (mais simples, sem precisar de currículos)

### Tipografia
- Mantém: Manrope, Playfair Display, DM Mono
- Headings maiores e mais leves
- Mais espaço entre linhas

### Layout
- Grid masonry limpo (sem efeitos 3D desnecessários)
- Lightbox elegante
- Filtros em sidebar sticky
- Cards com sombra suave e bordas finas
- Modal com layout arejado, abas claras e conteúdo respirando

## Mudanças no código

### Estrutura de arquivos
```
curso_arte/
├── index.html → welcome.html (tela única de boas-vindas/login)
├── home.html (nova)
├── galeria.html (reformulada)
├── alunos.html (nova, substitui artistas.html)
├── orientadores.html (nova)
├── acervo.html (reformulada, substitui docs.html)
├── perfil.html (nova)
├── obra.html (nova)
├── assets/
│   ├── style.css (modularizar)
│   ├── supabase.js (manter)
│   ├── config.js (manter)
│   ├── auth.js (refatorar)
│   ├── nav.js (injeção de navegação)
│   ├── galeria.js (lógica da galeria)
│   ├── perfil.js (lógica do perfil)
│   └── ...
├── data/ (manter como fallback)
├── supabase/
│   ├── schema.sql (atualizar)
│   ├── rls.sql (atualizar)
│   └── setup.md (atualizar)
└── docs/
    └── implementation-plan.md
```

### Refatoração do CSS
Dividir `style.css` em:
- `reset.css` — reset e variáveis
- `layout.css` — header, grid, footer
- `components.css` — botões, cards, forms, lightbox
- `pages.css` — estilos específicos por página

### Refatoração do JS
- Eliminar cópias de lógica de render (há 3-4 cópias no projeto atual)
- Centralizar em um módulo de dados
- Usar templates consistentes

## Limpeza

### Arquivos a remover
- `assets/art-01.svg` a `art-06.svg` (placeholders não usados)
- `assets/vid-01*.mp4` e outras variações (vídeos antigos)
- `data/arts.json` (depreciado)
- `app.js` (órfão)
- `bg.js` (órfão)
- `entre_acervo_artes_prototipo.zip` (protótipo antigo)
- Vídeos grandes do repositório Git (usar Git LFS ou Supabase Storage)

### Manter
- `data/artists.json` e `data/works.json` (fallback)
- `data/documents.json` (acervo)

## Fases de implementação

### Fase A — Limpeza e estrutura (1-2 dias)
- [ ] Remover arquivos não usados
- [ ] Limpar vídeos grandes do Git
- [ ] Modularizar CSS
- [ ] Refatorar JS (eliminar duplicação)

### Fase B — Novas páginas e navegação (3-4 dias)
- [ ] Criar `welcome.html` (substitui login.html)
- [ ] Criar `home.html` (hub)
- [ ] Reformular `galeria.html` (foco em obras)
- [ ] Criar `alunos.html` e `orientadores.html`
- [ ] Reformular `acervo.html`
- [ ] Criar `perfil.html` e `obra.html`
- [ ] Atualizar navegação global

### Fase C — Banco de dados (1-2 dias)
- [ ] Adicionar tabelas `work_requests` e `critiques`
- [ ] Modificar `works` (adicionar `visibility`, `youtube_url`, `advisor_id`)
- [ ] Modificar `artists` (adicionar `username`, `is_curator`)
- [ ] Atualizar RLS policies
- [ ] Atualizar `schema.sql` e `rls.sql`

### Fase D — Funcionalidades (3-4 dias)
- [ ] CRUD de obras com upload (Supabase Storage + YouTube)
- [ ] Sistema de solicitações de orientação
- [ ] Sistema de críticas
- [ ] Perfil público/privado
- [ ] Lightbox reformulado
- [ ] Filtros da galeria

### Fase E — Deploy (1 dia)
- [ ] Configurar Vercel
- [ ] Variáveis de ambiente
- [ ] Testes finais
- [ ] Documentação

## Próximos passos imediatos

1. **Você aprova o plano?** Posso ajustar antes de começar
2. **Confirma os papéis** (aluno=artista, orientador=especialista/curador)?
3. **Começo pela Fase A** (limpeza)?

Após aprovação, começo com a limpeza e em seguida as novas páginas. Toda a refatoração será feita mantendo o repositório no GitHub funcional.
