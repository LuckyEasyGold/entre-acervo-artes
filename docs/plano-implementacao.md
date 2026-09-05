# ENTRE — Plano de Implementação: Roles, Aprovação e Fluxo de Publicação

## 1. Objetivo
Garantir que o cadastro, a publicação e a moderação do ENTRE tenham regras claras, com aprovação por orientadores, possibilidade de troca de orientador, eleição de moderadores e proteção básica de conteúdo.

## 2. Regras de negócio
- **Papéis (roles):**
  - `adm`: administrador do sistema, sem perfil público
  - `moderador`: aluno-artista eleito por 3 orientadores, pode publicar sem aprovação individual
  - `orientador`: professor/especialista aprovado, pode aprovar/rejeitar cadastros e obras
  - `artista`: aluno em formação, precisa de aprovação para publicar

- **Cadastro:**
  - Todo novo cadastro nasce como `pending`
  - Apenas `adm`, `moderador` ou `orientador` pode aprovar/rejeitar cadastros
  - Cadastro aprovado vira `artista` ou `orientador` conforme escolha inicial

- **Perfil do artista:**
  - Pode escolher 1 orientador responsável
  - Pode solicitar troca de orientador a qualquer momento
  - Orientador pode aceitar ou recusar o vínculo

- **Publicação de obra:**
  - `artista` → obra criada como `pending`, aguarda aprovação do orientador responsável
  - `moderador` → obra criada como `published` diretamente
  - `orientador` → obra criada como `published` diretamente
  - Artista pode solicitar troca de orientador se o atual não responder

- **Eleição de moderador:**
  - Qualquer `orientador` pode propor a elevação de um `artista` a `moderador`
  - São necessários 3 votos de `orientador` diferentes para aprovar
  - `adm` pode aprovar diretamente

- **Visualização e proteção:**
  - Qualquer visitante vê previews públicos
  - Acesso ao conteúdo completo (imagem expandida, vídeo, PDF) apenas para `artista`, `orientador`, `moderador` e `adm`
  - Conteúdo protegido contra download direto (overlay + desabilitar botão direito)
  - Marca d'água com nome do artista e nome do site
  - Vídeos devem ser links do YouTube (público)
  - Imagens devem ser links do Pinterest (público)

## 3. Alterações no banco (Supabase)
- Tabela `artists`:
  - `role`: `adm | moderador | orientador | artista`
  - `status`: `pending | approved | rejected`
  - `approved_by`, `approved_at`
  - `advisor_id`: orientador responsável
  - `moderator_votes`: contagem de votos para moderador

- Tabela `works`:
  - `status`: `pending | published | rejected`
  - `reviewed_by`: UUID do orientador/moderador que aprovou
  - `reviewed_at`: timestamp

- Tabela `advisor_votes`:
  - `artist_id`: aluno
  - `advisor_id`: orientador que votou
  - `created_at`

## 4. Telas/arquivos envolvidos
- `login.html` / `welcome.html`: mensagem de aguardando aprovação
- `perfil.html` / `perfil.js`: edição de perfil + escolha/solicitação de orientador
- `moderacao.html` / `moderacao.js`: aprovação de cadastros e votação de moderadores
- `obra.html` / `obra.js`: visualização protegida com marca d'água
- `galeria.html` / `galeria.js`: lightbox de visualização
- `artista.html` / `artista.js`: mesmo tratamento de obra
- `assets/style.css`: estilos de lightbox, overlay e marca d'água

## 5. Ordem de implementação sugerida
1. Atualizar schema no Supabase
2. Cadastro com status pending + bloqueio de login
3. Página de moderação (cadastros + votação de moderador)
4. Perfil com seleção de orientador
5. Publicação com aprovação do orientador
6. Lightbox/proteção de conteúdo (marca d'água, bloqueio de botão direito, acesso restrito)
7. Upload via URL (YouTube/Pinterest) com validação
