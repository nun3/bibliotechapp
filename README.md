# 📚 Bibliotech - Sistema de Biblioteca Digital

Um sistema moderno e completo para gerenciamento de bibliotecas digitais, desenvolvido com React, TypeScript e Supabase.

![Bibliotech](https://img.shields.io/badge/React-18.2.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-blue)
![Supabase](https://img.shields.io/badge/Supabase-2.38.4-green)
![Vite](https://img.shields.io/badge/Vite-4.5.0-purple)

## ✨ Funcionalidades

### 🔐 Sistema de Autenticação
- Login e registro de usuários
- Controle de acesso baseado em roles (Admin/Usuário)
- Proteção de rotas administrativas

### 📖 Gerenciamento de Livros
- **Cadastro por ISBN**: Busca automática de informações via Google Books API
- **Leitor de Código de Barras**: Escaneamento de códigos ISBN para cadastro rápido
- Catálogo completo com busca e filtros
- Gerenciamento de cópias disponíveis

### 📋 Sistema de Empréstimos
- Empréstimo e devolução de livros
- Histórico completo de empréstimos
- Notificações de vencimento
- Relatórios de empréstimos

### 👥 Gerenciamento de Usuários
- Perfil de usuário completo
- Painel administrativo
- Controle de acesso e permissões

### 📊 Dashboard e Relatórios
- Estatísticas em tempo real
- Relatórios de empréstimos
- Métricas de uso da biblioteca

## 🚀 Tecnologias Utilizadas

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod
- **Notifications**: React Hot Toast
- **Barcode Scanner**: @zxing/library

## 📦 Instalação

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Conta no Supabase

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/bibliotech.git
cd bibliotech
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
```bash
cp env.example .env.local
```

Edite o arquivo `.env.local` com suas credenciais do Supabase:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

### 4. Configure o banco de dados
Execute o script SQL no Supabase SQL Editor:
```sql
-- Execute o conteúdo do arquivo supabase-schema.sql
```

### 5. Execute o projeto
```bash
npm run dev
```

O projeto estará disponível em `http://localhost:5173`

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais
- **users**: Usuários do sistema
- **books**: Catálogo de livros
- **loans**: Empréstimos
- **notifications**: Notificações do sistema

### Políticas RLS (Row Level Security)
- Controle de acesso baseado em roles
- Usuários só podem ver seus próprios empréstimos
- Administradores têm acesso completo

## 🎯 Funcionalidades Detalhadas

### 📱 Leitor de Código de Barras
- Suporte para formatos EAN-13, CODE-128, CODE-39, EAN-8
- Validação automática de códigos ISBN
- Interface intuitiva com feedback visual
- Acesso à câmera do dispositivo

### 🔍 Busca Inteligente
- Busca por título, autor, ISBN
- Filtros por gênero, disponibilidade
- Resultados em tempo real

### 📊 Dashboard Administrativo
- Estatísticas de empréstimos
- Livros mais populares
- Usuários ativos
- Empréstimos pendentes

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview

# Linting
npm run lint
```

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── admin/          # Componentes administrativos
│   ├── auth/           # Componentes de autenticação
│   ├── catalog/        # Componentes do catálogo
│   ├── dashboard/      # Componentes do dashboard
│   ├── layout/         # Componentes de layout
│   ├── loans/          # Componentes de empréstimos
│   ├── notifications/  # Componentes de notificações
│   ├── reports/        # Componentes de relatórios
│   └── ui/             # Componentes de UI reutilizáveis
├── contexts/           # Contextos React
├── hooks/              # Hooks customizados
├── lib/                # Utilitários e configurações
├── pages/              # Páginas da aplicação
└── services/           # Serviços e APIs
```

## 🔧 Configuração do Supabase

### 1. Crie um novo projeto no Supabase
### 2. Execute o schema SQL
### 3. Configure as políticas RLS
### 4. Ative a autenticação por email
### 5. Configure as variáveis de ambiente

## 🎨 Design System

- **Cores**: Paleta consistente com Tailwind CSS
- **Tipografia**: Inter font family
- **Componentes**: Design system modular
- **Responsividade**: Mobile-first approach
- **Acessibilidade**: Componentes acessíveis

## 📱 Recursos Mobile

- Interface responsiva
- Leitor de código de barras otimizado para mobile
- Touch-friendly interactions
- PWA ready

## 🔒 Segurança

- Autenticação JWT via Supabase
- Row Level Security (RLS)
- Validação de dados com Zod
- Sanitização de inputs
- HTTPS obrigatório em produção

## 🚀 Deploy

### Vercel (Recomendado)
1. Conecte seu repositório GitHub
2. Configure as variáveis de ambiente
3. Deploy automático

### Netlify
1. Build command: `npm run build`
2. Publish directory: `dist`
3. Configure as variáveis de ambiente

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Autores

- **Seu Nome** - *Desenvolvimento inicial* - [seu-github](https://github.com/seu-usuario)

## 🙏 Agradecimentos

- [Supabase](https://supabase.com/) - Backend as a Service
- [Google Books API](https://developers.google.com/books) - API de livros
- [Lucide](https://lucide.dev/) - Ícones
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS

## 📞 Suporte

Se você encontrar algum problema ou tiver dúvidas, por favor:

1. Verifique as [Issues](https://github.com/seu-usuario/bibliotech/issues) existentes
2. Crie uma nova issue com detalhes do problema
3. Entre em contato via email: seu-email@exemplo.com

---

⭐ **Se este projeto foi útil para você, considere dar uma estrela!**