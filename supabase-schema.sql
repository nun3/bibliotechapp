-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de usuários da biblioteca (extensão da tabela auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  library_card_number TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de livros
CREATE TABLE public.books (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT UNIQUE,
  publisher TEXT,
  publication_year INTEGER,
  genre TEXT,
  description TEXT,
  cover_url TEXT,
  total_copies INTEGER DEFAULT 1,
  available_copies INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de empréstimos
CREATE TABLE public.loans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  loan_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  return_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'returned', 'overdue')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de reservas
CREATE TABLE public.reservations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  reservation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Função para gerar número da carteirinha
CREATE OR REPLACE FUNCTION generate_library_card_number()
RETURNS TEXT AS $$
DECLARE
  card_number TEXT;
  counter INTEGER := 1;
BEGIN
  LOOP
    card_number := 'BC' || LPAD(EXTRACT(EPOCH FROM NOW())::TEXT, 10, '0') || LPAD(counter::TEXT, 3, '0');
    
    -- Verificar se o número já existe
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE library_card_number = card_number) THEN
      RETURN card_number;
    END IF;
    
    counter := counter + 1;
    
    -- Evitar loop infinito
    IF counter > 999 THEN
      card_number := 'BC' || LPAD(EXTRACT(EPOCH FROM NOW())::TEXT, 10, '0') || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
      RETURN card_number;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função para criar usuário automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, library_card_number, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    generate_library_card_number(),
    'user'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar usuário automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função para atualizar available_copies quando um empréstimo é criado
CREATE OR REPLACE FUNCTION update_available_copies_on_loan()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Diminuir cópias disponíveis
    UPDATE public.books 
    SET available_copies = available_copies - 1,
        updated_at = NOW()
    WHERE id = NEW.book_id;
    
    -- Atualizar status para overdue se necessário
    IF NEW.due_date < NOW() THEN
      NEW.status := 'overdue';
    END IF;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Se o empréstimo foi devolvido
    IF OLD.status = 'active' AND NEW.status = 'returned' THEN
      -- Aumentar cópias disponíveis
      UPDATE public.books 
      SET available_copies = available_copies + 1,
          updated_at = NOW()
      WHERE id = NEW.book_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar cópias disponíveis
CREATE TRIGGER update_available_copies_trigger
  AFTER INSERT OR UPDATE ON public.loans
  FOR EACH ROW EXECUTE FUNCTION update_available_copies_on_loan();

-- Função para verificar empréstimos vencidos
CREATE OR REPLACE FUNCTION check_overdue_loans()
RETURNS void AS $$
BEGIN
  UPDATE public.loans 
  SET status = 'overdue',
      updated_at = NOW()
  WHERE status = 'active' 
    AND due_date < NOW();
END;
$$ LANGUAGE plpgsql;

-- Políticas de segurança (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Políticas para livros (todos podem ver)
CREATE POLICY "Anyone can view books" ON public.books
  FOR SELECT USING (true);

CREATE POLICY "Anyone can update books" ON public.books
  FOR UPDATE USING (true);

-- Políticas para empréstimos
CREATE POLICY "Users can view their own loans" ON public.loans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own loans" ON public.loans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own loans" ON public.loans
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para reservas
CREATE POLICY "Users can view their own reservations" ON public.reservations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reservations" ON public.reservations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Inserir alguns livros de exemplo
INSERT INTO public.books (title, author, isbn, publisher, publication_year, genre, description, total_copies, available_copies) VALUES
('O Senhor dos Anéis', 'J.R.R. Tolkien', '9788533613379', 'Martins Fontes', 1954, 'Fantasia', 'Uma das obras mais importantes da literatura fantástica mundial.', 3, 3),
('1984', 'George Orwell', '9788535902775', 'Companhia das Letras', 1949, 'Ficção Científica', 'Um romance distópico sobre totalitarismo e controle social.', 2, 2),
('Dom Casmurro', 'Machado de Assis', '9788535902776', 'Companhia das Letras', 1899, 'Literatura Brasileira', 'Um clássico da literatura brasileira sobre ciúme e traição.', 4, 4),
('Harry Potter e a Pedra Filosofal', 'J.K. Rowling', '9788532511010', 'Rocco', 1997, 'Fantasia', 'O primeiro livro da série Harry Potter.', 5, 5),
('A Revolução dos Bichos', 'George Orwell', '9788535909552', 'Companhia das Letras', 1945, 'Ficção', 'Uma fábula sobre poder e corrupção.', 3, 3);
