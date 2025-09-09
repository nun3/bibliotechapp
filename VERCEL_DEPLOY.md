# 🚀 Deploy no Vercel - Bibliotech

Este guia explica como fazer o deploy do projeto Bibliotech no Vercel.

## 📋 Pré-requisitos

- Conta no [Vercel](https://vercel.com)
- Conta no [Supabase](https://supabase.com)
- Repositório no GitHub/GitLab

## 🔧 Configuração do Supabase

### 1. Criar projeto no Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Anote a URL e a chave anônima

### 2. Executar o schema SQL
1. No painel do Supabase, vá para **SQL Editor**
2. Execute o conteúdo do arquivo `supabase-schema.sql`
3. Verifique se todas as tabelas foram criadas

### 3. Configurar autenticação
1. Vá para **Authentication > Settings**
2. Configure os providers de autenticação
3. Ative **Email** como provider

## 🚀 Deploy no Vercel

### Método 1: Deploy via GitHub (Recomendado)

1. **Conectar repositório:**
   - Acesse [vercel.com](https://vercel.com)
   - Clique em "New Project"
   - Conecte seu repositório GitHub

2. **Configurar projeto:**
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Configurar variáveis de ambiente:**
   ```
   VITE_SUPABASE_URL=sua_url_do_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
   ```

4. **Deploy:**
   - Clique em "Deploy"
   - Aguarde o build completar

### Método 2: Deploy via CLI

1. **Instalar Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login no Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Configurar variáveis de ambiente:**
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   ```

## ⚙️ Configurações do Vercel

### Build Settings
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`
- **Node.js Version:** 18.x

### Environment Variables
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Headers (Configurado no vercel.json)
- **Security Headers:** X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
- **Cache Headers:** Assets com cache de 1 ano

## 🔍 Verificação Pós-Deploy

### 1. Testar funcionalidades básicas:
- [ ] Login/Registro funcionando
- [ ] Navegação entre páginas
- [ ] Cadastro de livros por ISBN
- [ ] Leitor de código de barras
- [ ] Sistema de empréstimos

### 2. Verificar console do navegador:
- [ ] Sem erros de JavaScript
- [ ] Conexão com Supabase funcionando
- [ ] Variáveis de ambiente carregadas

### 3. Testar em diferentes dispositivos:
- [ ] Desktop
- [ ] Mobile
- [ ] Tablet

## 🐛 Troubleshooting

### Erro: "Failed to fetch"
- Verifique se as variáveis de ambiente estão configuradas
- Confirme se a URL do Supabase está correta

### Erro: "Invalid API key"
- Verifique se a chave anônima do Supabase está correta
- Confirme se as políticas RLS estão configuradas

### Erro: "Build failed"
- Verifique se todas as dependências estão no package.json
- Confirme se o Node.js version está correto (18.x)

### Leitor de código de barras não funciona:
- Verifique se o site está sendo servido via HTTPS
- Confirme se as permissões de câmera estão sendo solicitadas

## 📊 Monitoramento

### Vercel Analytics
1. Ative o Vercel Analytics no painel
2. Monitore performance e erros
3. Configure alertas para falhas

### Supabase Dashboard
1. Monitore queries no painel do Supabase
2. Verifique logs de autenticação
3. Acompanhe uso da API

## 🔄 Atualizações

### Deploy automático:
- Push para a branch `main` = deploy automático
- Pull requests = preview deployments

### Deploy manual:
```bash
vercel --prod
```

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs no Vercel Dashboard
2. Consulte a documentação do [Vercel](https://vercel.com/docs)
3. Consulte a documentação do [Supabase](https://supabase.com/docs)

---

🎉 **Parabéns! Seu projeto Bibliotech está no ar!**
