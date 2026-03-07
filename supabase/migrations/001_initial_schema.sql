-- =============================================
-- Бюро ремонтов — Initial Database Schema
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS & PROFILES
-- =============================================

CREATE TYPE user_role AS ENUM ('client', 'master', 'supervisor', 'admin');

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  role user_role NOT NULL DEFAULT 'client',
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Master-specific profile data
CREATE TABLE master_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  specializations TEXT[] NOT NULL DEFAULT '{}',
  portfolio_urls TEXT[] NOT NULL DEFAULT '{}',
  rating NUMERIC(2,1) NOT NULL DEFAULT 0.0,
  reviews_count INTEGER NOT NULL DEFAULT 0,
  is_verified BOOLEAN NOT NULL DEFAULT false
);

-- =============================================
-- PROJECTS
-- =============================================

CREATE TYPE repair_type AS ENUM ('cosmetic', 'standard', 'premium', 'design');
CREATE TYPE project_status AS ENUM ('new', 'planning', 'in_progress', 'completed', 'cancelled');

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES profiles(id),
  supervisor_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  address TEXT NOT NULL,
  area_sqm NUMERIC(6,1) NOT NULL,
  repair_type repair_type NOT NULL DEFAULT 'standard',
  budget_min NUMERIC(12,2),
  budget_max NUMERIC(12,2),
  status project_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- STAGE TEMPLATES (predefined renovation stages)
-- =============================================

CREATE TABLE stage_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  order_index INTEGER NOT NULL,
  checklist TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default templates
INSERT INTO stage_templates (title, description, order_index, checklist) VALUES
  ('Демонтаж', 'Снятие старых покрытий, демонтаж перегородок', 1, ARRAY['Снятие обоев', 'Демонтаж напольного покрытия', 'Демонтаж сантехники', 'Вывоз мусора']),
  ('Электрика (черновая)', 'Прокладка кабелей, установка подрозетников', 2, ARRAY['Штробление стен', 'Прокладка кабеля', 'Установка подрозетников', 'Проверка линий']),
  ('Сантехника (черновая)', 'Разводка труб водоснабжения и канализации', 3, ARRAY['Разводка водоснабжения', 'Разводка канализации', 'Проверка герметичности']),
  ('Стяжка пола', 'Выравнивание пола, заливка стяжки', 4, ARRAY['Грунтовка основания', 'Установка маяков', 'Заливка стяжки', 'Проверка уровня']),
  ('Штукатурка стен', 'Выравнивание стен штукатуркой', 5, ARRAY['Грунтовка стен', 'Установка маяков', 'Нанесение штукатурки', 'Проверка ровности']),
  ('Укладка плитки', 'Облицовка стен и пола плиткой', 6, ARRAY['Подготовка поверхности', 'Разметка', 'Укладка плитки', 'Затирка швов']),
  ('Электрика (чистовая)', 'Установка розеток, выключателей, светильников', 7, ARRAY['Установка розеток', 'Установка выключателей', 'Монтаж светильников', 'Проверка работоспособности']),
  ('Сантехника (чистовая)', 'Установка унитаза, раковин, смесителей', 8, ARRAY['Установка унитаза', 'Установка раковины', 'Установка смесителей', 'Проверка герметичности']),
  ('Шпаклёвка и покраска', 'Финишная шпаклёвка и покраска стен/потолка', 9, ARRAY['Шпаклёвка стен', 'Шлифовка', 'Грунтовка', 'Покраска']),
  ('Укладка напольного покрытия', 'Монтаж ламината, паркета или линолеума', 10, ARRAY['Подготовка основания', 'Укладка подложки', 'Монтаж покрытия', 'Установка плинтусов']),
  ('Установка дверей', 'Монтаж межкомнатных и входных дверей', 11, ARRAY['Подготовка проёмов', 'Установка коробки', 'Навеска полотна', 'Установка наличников']),
  ('Монтаж потолков', 'Натяжные или подвесные потолки', 12, ARRAY['Разметка', 'Установка профиля', 'Монтаж полотна/панелей', 'Установка светильников']),
  ('Чистовая отделка', 'Финальные штрихи: обои, декор', 13, ARRAY['Поклейка обоев', 'Декоративные элементы', 'Установка карнизов']),
  ('Финальная уборка', 'Генеральная уборка после ремонта', 14, ARRAY['Уборка строительного мусора', 'Мытьё окон', 'Мытьё полов', 'Протирка поверхностей']);

-- =============================================
-- PROJECT STAGES
-- =============================================

CREATE TYPE stage_status AS ENUM ('pending', 'in_progress', 'done_by_master', 'approved', 'rejected');

CREATE TABLE stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  master_id UUID REFERENCES profiles(id),
  template_id UUID REFERENCES stage_templates(id),
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  status stage_status NOT NULL DEFAULT 'pending',
  deadline DATE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- PHOTO REPORTS
-- =============================================

CREATE TABLE photo_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stage_id UUID NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  url TEXT NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- CHAT MESSAGES
-- =============================================

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  text TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- REVIEWS
-- =============================================

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id),
  master_id UUID NOT NULL REFERENCES profiles(id),
  client_id UUID NOT NULL REFERENCES profiles(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- PAYMENT RECORDS (manual tracking for MVP)
-- =============================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id),
  stage_id UUID REFERENCES stages(id),
  amount NUMERIC(12,2) NOT NULL,
  method TEXT NOT NULL DEFAULT 'cash', -- cash, transfer
  confirmed_by UUID REFERENCES profiles(id), -- admin who confirmed
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_supervisor ON projects(supervisor_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_stages_project ON stages(project_id);
CREATE INDEX idx_stages_master ON stages(master_id);
CREATE INDEX idx_chat_project ON chat_messages(project_id);
CREATE INDEX idx_chat_created ON chat_messages(created_at);
CREATE INDEX idx_photos_stage ON photo_reports(stage_id);
CREATE INDEX idx_reviews_master ON reviews(master_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read their own profile, admins can read all
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Projects: clients see own, supervisors see assigned, admins see all
CREATE POLICY "Clients see own projects" ON projects
  FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Supervisors see assigned projects" ON projects
  FOR SELECT USING (supervisor_id = auth.uid());

CREATE POLICY "Admins see all projects" ON projects
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Chat: participants of a project can read/write messages
CREATE POLICY "Project participants can read chat" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN stages s ON s.project_id = p.id
      WHERE p.id = chat_messages.project_id
      AND (p.client_id = auth.uid() OR p.supervisor_id = auth.uid() OR s.master_id = auth.uid())
    )
  );

CREATE POLICY "Project participants can send messages" ON chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN stages s ON s.project_id = p.id
      WHERE p.id = project_id
      AND (p.client_id = auth.uid() OR p.supervisor_id = auth.uid() OR s.master_id = auth.uid())
    )
  );

-- =============================================
-- UPDATED_AT TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
