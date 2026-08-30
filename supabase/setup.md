# Configuração do Supabase — ENTRE Acervo de Artes

## Passo 1: Criar projeto no Supabase

1. Acesse https://supabase.com e crie uma conta
2. Clique em "New project"
3. Nome do projeto: `entre-acervo-artes`
4. Senha do banco: guarde-a com segurança
5. Região: escolha a mais próxima (ex: South America)
6. Aguarde a criação do projeto (~2 minutos)

## Passo 2: Executar SQL de criação das tabelas

1. No painel do Supabase, vá em **SQL Editor**
2. Clique em "New query"
3. Copie todo o conteúdo de `supabase/schema.sql` e cole no editor
4. Clique em **Run** (ou Ctrl+Enter)
5. Repita o processo com `supabase/rls.sql`

## Passo 3: Configurar Autenticação

1. Vá em **Authentication** > **Providers**
2. Certifique-se de que **Email** está habilitado
3. Em **Email Settings**, configure:
   - Enable email confirmations: ON (recomendado)
   - Enable phone confirmations: OFF
4. Copie a **URL do site** e **anon key**:
   - Vá em **Settings** > **API**
   - Copie `project URL` e `anon public` key

## Passo 4: Configurar Storage

1. Vá em **Storage**
2. Crie 3 buckets:
   - `avatars` — fotos de perfil (privado)
   - `works` — arquivos de obras (público)
   - `thumbnails` — miniaturas (opcional, público)

3. Para cada bucket, vá em **Policies** e adicione:
   ```sql
   -- Permitir upload para usuários autenticados
   CREATE POLICY "authenticated_upload" ON storage.objects FOR INSERT
   TO authenticated WITH CHECK (bucket_id IN ('avatars', 'works', 'thumbnails'));

   -- Permitir leitura pública (ajuste conforme necessidade)
   CREATE POLICY "public_read" ON storage.objects FOR SELECT
   TO public USING (bucket_id IN ('works', 'thumbnails'));
   ```

## Passo 5: Configurar o frontend

1. Abra `assets/supabase.js`
2. Substitua as credenciais:
   ```javascript
   const SUPABASE_URL = "https://SEU_PROJETO.supabase.co";
   const SUPABASE_ANON_KEY = "SUA_ANON_KEY";
   ```
3. Salve o arquivo

## Passo 6: Testar o fluxo

1. Inicie o servidor local: `python -m http.server 8080`
2. Abra http://localhost:8080/login.html
3. Teste criar uma conta e fazer login
4. Acesse o dashboard em http://localhost:8080/dashboard.html
5. Preencha o perfil e cadastre uma obra

## Passo 7: Criar usuário admin (opcional)

1. No SQL Editor do Supabase, execute:
   ```sql
   INSERT INTO public.artists (user_id, name, type, email)
   VALUES ('UUID_DO_USUARIO_ADMIN', 'Admin', 'admin', 'admin@ifpr.edu.br');
   ```
   (O `user_id` é obtido após o admin se cadastrar no site)

## Observações importantes

- Nunca compartilhe a `service_role` key (ela tem acesso total)
- O bucket `avatars` pode ser configurado como privado se não quiser expor fotos
- O bucket `works` deve ser público para que as obras apareçam no acervo
- Para produção, configure um domínio próprio em **Authentication** > **URL Configuration**
- Habilite CORS no Supabase se for hospedar o frontend em domínio diferente

## Próximos passos (Fase 2)

- Implementar upload de avatar no perfil
- Implementar vínculo aluno-orientador
- Integrar grid de obras com dados do Supabase
- Adicionar filtros por categoria usando a tabela `categories`
