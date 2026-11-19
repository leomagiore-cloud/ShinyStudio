
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'colaborador');
CREATE TYPE public.appointment_status AS ENUM ('pendente', 'confirmado', 'em_andamento', 'concluido', 'cancelado');
CREATE TYPE public.payment_method AS ENUM ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'transferencia', 'pendente');
CREATE TYPE public.photo_kind AS ENUM ('antes', 'depois');

-- Updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  studio_name TEXT DEFAULT 'Shiny Studio',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Auto profile + first user becomes admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INT;
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));

  SELECT COUNT(*) INTO user_count FROM auth.users;
  IF user_count = 1 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'colaborador');
  END IF;

  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CLIENTS
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients readable by team" ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Clients insertable by team" ON public.clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Clients updatable by team" ON public.clients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Clients deletable by admin" ON public.clients FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_clients_updated BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_clients_name ON public.clients (lower(name));

-- VEHICLES
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  plate TEXT,
  brand TEXT,
  model TEXT,
  year INT,
  color TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT ALL ON public.vehicles TO service_role;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Vehicles readable by team" ON public.vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Vehicles insertable by team" ON public.vehicles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Vehicles updatable by team" ON public.vehicles FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Vehicles deletable by admin" ON public.vehicles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_vehicles_updated BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_vehicles_plate ON public.vehicles (upper(plate));
CREATE INDEX idx_vehicles_client ON public.vehicles (client_id);

-- SERVICE CATALOG
CREATE TABLE public.service_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration_minutes INT NOT NULL DEFAULT 60,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_catalog TO authenticated;
GRANT ALL ON public.service_catalog TO service_role;
ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Catalog readable by team" ON public.service_catalog FOR SELECT TO authenticated USING (true);
CREATE POLICY "Catalog insertable by team" ON public.service_catalog FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Catalog updatable by team" ON public.service_catalog FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Catalog deletable by admin" ON public.service_catalog FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_catalog_updated BEFORE UPDATE ON public.service_catalog FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.service_catalog (name, description, price, duration_minutes) VALUES
  ('Lavagem Simples', 'Lavagem externa rápida', 80.00, 60),
  ('Lavagem Detalhada', 'Lavagem externa + interna completa', 180.00, 120),
  ('Polimento Técnico', 'Polimento de pintura para remoção de riscos leves', 600.00, 240),
  ('Vitrificação Cerâmica', 'Aplicação de coating cerâmico de longa duração', 1800.00, 480),
  ('Higienização de Couro', 'Limpeza e hidratação de bancos de couro', 350.00, 180),
  ('Cristalização de Pintura', 'Brilho profundo e proteção temporária', 250.00, 120);

-- APPOINTMENTS
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.service_catalog(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status appointment_status NOT NULL DEFAULT 'pendente',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Appointments readable by team" ON public.appointments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Appointments insertable by team" ON public.appointments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Appointments updatable by team" ON public.appointments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Appointments deletable by admin" ON public.appointments FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_appointments_updated BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_appointments_starts_at ON public.appointments (starts_at);

-- SERVICE ORDERS
CREATE TABLE public.service_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number SERIAL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.service_catalog(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  status appointment_status NOT NULL DEFAULT 'pendente',
  service_name TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method payment_method NOT NULL DEFAULT 'pendente',
  paid_at TIMESTAMPTZ,
  checklist JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_orders TO authenticated;
GRANT ALL ON public.service_orders TO service_role;
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Orders readable by team" ON public.service_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Orders insertable by team" ON public.service_orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Orders updatable by team" ON public.service_orders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Orders deletable by admin" ON public.service_orders FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.service_orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_orders_created_at ON public.service_orders (created_at DESC);

-- SERVICE PHOTOS
CREATE TABLE public.service_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  kind photo_kind NOT NULL,
  storage_path TEXT NOT NULL,
  caption TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_photos TO authenticated;
GRANT ALL ON public.service_photos TO service_role;
ALTER TABLE public.service_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Photos readable by team" ON public.service_photos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Photos insertable by team" ON public.service_photos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Photos updatable by team" ON public.service_photos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Photos deletable by team" ON public.service_photos FOR DELETE TO authenticated USING (true);
CREATE INDEX idx_photos_order ON public.service_photos (order_id);
