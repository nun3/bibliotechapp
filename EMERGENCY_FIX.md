# 🚨 CORREÇÃO DE EMERGÊNCIA - Recursão Infinita RLS

## ⚠️ PROBLEMA DETECTADO
```
infinite recursion detected in policy for relation "users"
```

## 🔧 SOLUÇÃO IMEDIATA

### Passo 1: Acesse o Supabase
1. Vá para [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Clique em **SQL Editor**

### Passo 2: Execute o Script de Emergência
1. Copie **TODO** o conteúdo do arquivo `emergency-rls-fix.sql`
2. Cole no SQL Editor
3. Clique em **Run**

### Passo 3: Verificar
1. Recarregue a página do sistema
2. Vá para **AdminProfile > Empréstimos > Diagnóstico**
3. Execute os testes novamente

## 📋 O que o Script Faz

✅ **Remove todas as políticas RLS problemáticas**
✅ **Desabilita RLS temporariamente**
✅ **Recria políticas mínimas (permitir tudo)**
✅ **Atualiza seu usuário como admin**
✅ **Garante que você está na tabela users**

## 🔍 Verificação

Após executar o script, você deve ver:
- ✅ Usuário autenticado
- ✅ Usuário é administrador
- ✅ Acesso às tabelas funcionando
- ✅ Sem erros de recursão

## 🚀 Próximos Passos

1. **Teste o sistema** - Tente criar um empréstimo
2. **Se funcionar** - Podemos adicionar políticas mais restritivas depois
3. **Se não funcionar** - Verifique os logs do Supabase

## 📞 Suporte

Se ainda houver problemas:
1. Verifique os logs do Supabase Dashboard
2. Execute este comando para verificar políticas:
```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

## ⚡ Script Alternativo

Se o script principal não funcionar, execute este comando simples:
```sql
-- Desabilitar RLS completamente
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.books DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations DISABLE ROW LEVEL SECURITY;
```

**Isso permitirá que o sistema funcione SEM políticas RLS temporariamente.**
