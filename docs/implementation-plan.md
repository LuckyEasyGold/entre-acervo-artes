# Plano de Implementação — ENTRE Acervo de Artes (v2)

## 1. Objetivo
Transformar o protótipo estático em uma plataforma onde cada aluno/artista pode:
- Criar e editar seu perfil
- Cadastrar obras (foto, vídeo, documento)
- Vincular-se a um orientador
- Publicar conteúdo que entra automaticamente no acervo público
- No futuro, alimentar estatísticas/métricas

## 2. Visão geral da arquitetura
- Frontend: HTML/CSS/JS existente, com novas telas/páginas
- Backend/Banco: Supabase (PostgreSQL + Auth + Storage)
- Autenticação: Supabase Auth (email/senha)
- Armazenamento de arquivos: Supabase Storage (fotos, vídeos, PDFs)
- Dados relacionais: tabelas no PostgreSQL do Supabase

## 3. Estrutura do banco de dados (Supabase)

### Tabelas principais

#### `artists`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid (PK) | Identificador único |
| user_id | uuid (FK -> auth.users) | Vínculo com conta de login |
| name | text | Nome completo |
| type | text | `student` ou `advisor` |
| course | text | Ex: "Artes Visuais · 3º período" |
| title | text | Título acadêmico (orientadores) |
| area | text | Área de atuação (orientadores) |
| subjects | text[] | Disciplinas que leciona (orientadores) |
| image | text | URL da foto de perfil |
| bio | text | Biografia/currículo resumido |
| curriculum | text | Currículo completo (orientadores) |
| social | jsonb | Redes sociais (lattes, linkedin, instagram, etc.) |
| created_at | timestamptz | Data de criação |
| updated_at | timestamptz | Data de atualização |

#### `advisors_students` (tabela de relacionamento)
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid (PK) | Identificador |
| advisor_id | uuid (FK -> artists) | Orientador |
| student_id | uuid (FK -> artists) | Aluno |

#### `works`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid (PK) | Identificador |
| artist_id | uuid (FK -> artists) | Criador da obra |
| title | text | Título da obra |
| category | text | Categoria (foto, pintura, tcc, etc.) |
| year | int | Ano de criação |
| description | text | Descrição da obra |
| file_url | text | URL do arquivo no Supabase Storage |
| file_type | text | `image`, `video`, `pdf` |
| external_links | jsonb | Links externos relacionados |
| status | text | `draft` ou `published` |
| created_at | timestamptz | Data de criação |
| updated_at | timestamptz | Data de atualização |

#### `academic_productions` (opcional, separado)
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid (PK) | Identificador |
| artist_id | uuid (FK -> artists) | Autor |
| type | text | `livro`, `artigo`, `tcc`, etc. |
| title | text | Título |
| year | int | Ano |
| publisher | text | Editora/veículo |
| journal | text | Revista/evento |
| url | text | Link para documento |

#### `categories`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid (PK) | Identificador |
| name | text | Nome da categoria |
| slug | text | slug para URL |

## 4. Autenticação e perfis

### Fluxo de cadastro/login
1. Usuário clica em "Entrar" / "Criar conta"
2. Supabase Auth gerencia email/senha
3. Após primeiro login, usuário preenche perfil:
   - Nome completo
   - Tipo: aluno ou orientador
   - Curso/periodo (alunos) ou titulo/area (orientadores)
   - Foto
   - Bio
4. Aluno deve vincular-se a um orientador existente (select)
5. Orientador pode aprovar/rejeitar vínculo (opcional)

### Regras
- Todo artista é aluno do curso de Artes do IFPR
- Aluno DEVE ter um orientador vinculado para publicar
- Orientador pode ter múltiplos alunos
- Admin pode criar contas de orientador em lote (importação CSV)

## 5. Funcionalidades por tipo de usuário

### Aluno
- Editar perfil (nome, foto, bio, curso)
- Vincular/desvincular orientador (mediante aprovação)
- Cadastrar obras (upload de arquivo + metadados)
- Salvar rascunhos
- Publicar obras (entram no acervo público)
- Ver estatísticas próprias (views, downloads)
- Excluir/editar próprias obras

### Orientador
- Tudo que o aluno faz
- Aprovar/rejeitar vínculos de alunos
- Ver lista de alunos orientados
- Cadastrar produções acadêmicas (livros, artigos)
- Adicionar links externos de obras
- Ver estatísticas dos orientandos

### Admin
- Gerenciar usuários (criar, editar, remover)
- Cadastrar orientadores em lote
- Gerenciar categorias
- Ver todas as estatísticas
- Aprovar/rejeitar conteúdos (moderação)
- Exportar dados para relatórios

## 6. Páginas/Views a serem criadas/modificadas

### Telas existentes (manter)
- `index.html` — Home com hero, explore, artistas, coleções
- `docs.html` — Documentos

### Novas telas
- `login.html` — Login/cadastro
- `dashboard.html` — Painel do usuário (minhas obras, rascunhos, perfil)
- `work-form.html` — Formulário de cadastro/edição de obra
- `artist-public.html` — Perfil público do artista (já existe como modal, pode virar página)
- `admin.html` — Painel administrativo
- `stats.html` — Estatísticas/métricas (futuro)

### Modificações
- Modal de perfil do artista: carregar dados do Supabase
- Grid de obras: paginar/filtrar por categorias do banco
- Navegação: adicionar links para dashboard quando logado

## 7. Upload e armazenamento

### Supabase Storage buckets
- `avatars` — fotos de perfil
- `works` — arquivos de obras (imagens, vídeos, PDFs)
- `thumbnails` — thumbnails gerados automaticamente

### Limites
- Imagens: max 10MB
- Vídeos: max 100MB
- PDFs: max 20MB

### Processo de upload
1. Usuário seleciona arquivo
2. Frontend faz upload direto para Supabase Storage (com progresso)
3. Salva URL no banco de dados
4. Gera thumbnail/miniatura (opcional, serverless function)

## 8. Categorias

Categorias padrão (seed inicial):
- foto
- pintura
- desenho
- escultura
- documentario
- video-arte
- danca
- musica
- teatro
- performance
- lipsync
- literatura
- publicacao
- tcc
- artigo
- instalacao
- performance
- arte-digital

## 9. Estatísticas e métricas (fase futura)

Dados a serem coletados:
- Views por obra
- Downloads por obra
- Publicações por período (dia/semana/mês)
- Categorias mais publicadas
- Alunos por orientador
- Taxa de aprovação de vínculos
- Tempo médio de aprovação

Dashboard com:
- Gráficos de publicações ao longo do tempo
- Top categorias
- Top artistas (por views/downloads)
- Exportação CSV/PDF

## 10. Segurança

- RLS (Row Level Security) no Supabase:
  - Alunos: CRUD apenas nas próprias obras
  - Orientadores: leitura das obras dos orientandos
  - Admin: acesso total
- Storage policies:
  - Upload: apenas usuários autenticados
  - Leitura: pública para works, privada para avatars (opcional)
- Validação de tipos de arquivo no frontend e backend
- Sanitização de inputs

## 11. Migração dos dados existentes

1. Criar projeto no Supabase
2. Executar SQL de criação das tabelas
3. Popular tabela `categories` com categorias padrão
4. Importar `artists.json` e `works.json` para as tabelas
5. Criar contas de admin e orientadores
6. Vincular alunos aos orientadores
7. Testar integração

## 12. Fases de implementação

### Fase 1 — Fundação (1-2 semanas)
- [ ] Criar projeto Supabase
- [ ] Configurar Auth (email/senha)
- [ ] Criar tabelas (SQL)
- [ ] Configurar Storage buckets
- [ ] Implementar RLS
- [ ] Criar tela de login/cadastro

### Fase 2 — Perfis (1 semana)
- [ ] CRUD de perfil
- [ ] Upload de avatar
- [ ] Vínculo aluno-orientador
- [ ] Edição de perfil

### Fase 3 — Obras (1-2 semanas)
- [ ] Cadastro de obras (formulário)
- [ ] Upload de arquivos
- [ ] Listagem de obras do usuário
- [ ] Publicação (status draft -> published)
- [ ] Integração com grid público

### Fase 4 — Admin (1 semana)
- [ ] Painel admin
- [ ] Gestão de usuários
- [ ] Aprovação de vínculos
- [ ] Moderação de conteúdo

### Fase 5 — Estatísticas (1 semana)
- [ ] Tracking de views/downloads
- [ ] Dashboard básico
- [ ] Exportação

## 13. Tecnologias

- Frontend: HTML, CSS, JS vanilla (manter stack atual)
- Backend: Supabase (PostgreSQL + Auth + Storage)
- Hospedagem: Netlify/Vercel (frontend) + Supabase (backend)
- Domínio: configurar conforme necessidade

## 14. Custo estimado (Supabase)

- Free tier: até 500MB banco, 2GB storage, 50K auth/mês
- Pro ($25/mês): 8GB banco, 100GB storage, 200K auth/mês
- Projeção inicial: Free tier suficiente para protótipo

## 15. Próximos passos imediatos

1. Criar conta no Supabase (supabase.com)
2. Criar novo projeto
3. Executar SQL de criação das tabelas (fornecerei)
4. Configurar Auth (email/senha habilitado)
5. Criar buckets de Storage
6. Implementar login/cadastro no frontend
7. Testar fluxo completo
