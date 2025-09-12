# Configuração do Supabase para Sistema de Empréstimos

## 🚨 IMPORTANTE: Execute estes comandos no Supabase SQL Editor

Para corrigir os erros de permissão, execute o arquivo `loan-rls-policies.sql` no SQL Editor do Supabase:

### Passo 1: Acesse o Supabase Dashboard
1. Vá para [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá para **SQL Editor** no menu lateral

### Passo 2: Execute o Script SQL
1. Copie todo o conteúdo do arquivo `loan-rls-policies.sql`
2. Cole no SQL Editor
3. Clique em **Run** para executar

### Passo 3: Verificar as Políticas
Após executar, verifique se as políticas foram criadas:
```sql
-- Verificar políticas de empréstimos
SELECT * FROM pg_policies WHERE tablename = 'loans';

-- Verificar políticas de livros
SELECT * FROM pg_policies WHERE tablename = 'books';

-- Verificar políticas de usuários
SELECT * FROM pg_policies WHERE tablename = 'users';
```

## 🔧 Políticas Criadas

### Para Tabela `loans`:
- ✅ **Administradores podem gerenciar empréstimos** - Permite que admins façam todas as operações
- ✅ **Usuários podem ver seus próprios empréstimos** - Usuários veem apenas seus empréstimos
- ✅ **Usuários podem criar empréstimos** - Usuários podem emprestar livros

### Para Tabela `books`:
- ✅ **Administradores podem gerenciar livros** - Admins gerenciam catálogo
- ✅ **Usuários autenticados podem ver livros** - Todos veem catálogo

### Para Tabela `users`:
- ✅ **Administradores podem gerenciar usuários** - Admins gerenciam usuários
- ✅ **Usuários podem ver seus próprios dados** - Usuários veem apenas seus dados
- ✅ **Usuários podem atualizar seus próprios dados** - Edição de perfil

## 🚀 Após Executar o Script

1. **Recarregue a página** do sistema
2. **Faça login como administrador**
3. **Teste a criação de empréstimos**

## 🔍 Solução de Problemas

### Se ainda houver erro 403/42501:
```sql
-- Verificar se o usuário atual é admin
SELECT id, email, role FROM public.users WHERE id = auth.uid();

-- Se não aparecer nada, o usuário não está na tabela users
-- Execute este comando para adicionar o usuário atual como admin:
INSERT INTO public.users (id, email, full_name, library_card_number, role)
VALUES (
  auth.uid(),
  auth.jwt() ->> 'email',
  COALESCE(auth.jwt() -> 'user_metadata' ->> 'full_name', 'Administrador'),
  'ADMIN' || EXTRACT(EPOCH FROM NOW())::TEXT,
  'admin'
)
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

### Se houver erro 406 Not Acceptable:
- Verifique se as colunas existem na tabela
- Verifique se as foreign keys estão corretas
- Verifique se os tipos de dados estão corretos

## 📋 Checklist de Verificação

- [ ] Script SQL executado com sucesso
- [ ] Políticas RLS criadas
- [ ] Usuário atual é administrador
- [ ] Tabelas `loans`, `books`, `users` existem
- [ ] Foreign keys estão configuradas
- [ ] Sistema recarregado
- [ ] Teste de empréstimo realizado

## 🆘 Suporte

Se ainda houver problemas:
1. Verifique os logs do Supabase
2. Verifique se o usuário está autenticado
3. Verifique se o usuário tem role 'admin'
4. Execute os comandos de verificação acima
