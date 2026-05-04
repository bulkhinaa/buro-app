# Клиентский state и API v0.2

> Структура Zustand stores, API endpoints, Edge Functions для клиентского пути v0.2.

## Stores (Zustand)

### 1. `leadStore` — заявка с лендинга / до авторизации
```typescript
interface LeadState {
  // Form fields
  address: string;
  area: number | null;
  name: string;
  phone: string;
  email: string;
  stopFactors: StopFactor[];  // включённые чек-боксы
  consentGiven: boolean;

  // Status
  isSubmitting: boolean;
  submittedLeadId: string | null;
  isOutOfScope: boolean;

  // Actions
  setField: <K extends keyof LeadFormFields>(key: K, value: LeadFormFields[K]) => void;
  toggleStopFactor: (factor: StopFactor) => void;
  submit: () => Promise<{ ok: boolean; leadId?: string }>;
  reset: () => void;
}

type StopFactor = 
  | 'replanning'
  | 'complex_ceilings'
  | 'tracks_smart_home'
  | 'q3_q4_decor'
  | 'custom_kitchen'
  | 'exotic_tile';
```

### 2. `projectDraftStore` — черновик проекта во время выбора пакета
```typescript
interface ProjectDraftState {
  // Linked data
  leadId: string | null;
  surveyId: string | null;  // данные замера

  // Selections
  area: number;
  tariff: 'base' | 'comfort' | null;
  colorScheme: 'light' | 'dark' | null;
  materialChoices: Record<string, string>;  // category -> material_id

  // Computed
  estimatedPrice: number | null;  // приходит с сервера
  estimatedDuration: number;       // 30 дней
  startDate: Date | null;
  endDate: Date | null;

  // Status
  step: 'area' | 'tariff' | 'color' | 'materials' | 'preview' | 'contract' | 'sign' | 'payment';

  // Actions
  setTariff: (t: 'base' | 'comfort') => void;
  setColorScheme: (s: 'light' | 'dark') => void;
  setMaterialChoice: (category: string, materialId: string) => void;
  goNext: () => void;
  goBack: () => void;
  fetchPreview: () => Promise<void>;  // запрашивает цену пакета
  reset: () => void;
}
```

### 3. `projectStore` — активный проект (после оплаты)
```typescript
interface ProjectState {
  project: Project | null;
  stages: Stage[];
  currentStage: Stage | null;
  supervisor: Supervisor | null;

  // Loading
  isLoading: boolean;
  error: string | null;

  // Actions
  loadProject: (id: string) => Promise<void>;
  approveStage: (stageId: string) => Promise<void>;
  rejectStage: (stageId: string, reason: string, photos?: string[]) => Promise<void>;
  
  // Realtime
  subscribeToStageUpdates: () => () => void;  // returns unsubscribe
}
```

### 4. `chatStore` — чат с супервайзером (адаптация v0.1)
```typescript
interface ChatState {
  messages: Message[];
  isLoading: boolean;
  isTyping: boolean;
  
  loadMessages: (projectId: string) => Promise<void>;
  sendMessage: (text: string, attachments?: string[]) => Promise<void>;
  subscribeToMessages: (projectId: string) => () => void;
}
```

## Таблицы БД (новые/изменённые в v0.2)

### Новые таблицы

#### `tariffs`
```sql
CREATE TABLE tariffs (
  id text PRIMARY KEY,            -- 'base' | 'comfort'
  name text NOT NULL,             -- 'База' | 'Комфорт'
  slogan text NOT NULL,
  description text NOT NULL,
  features text[] NOT NULL,       -- список буллетов «что входит»
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

#### `color_schemes`
```sql
CREATE TABLE color_schemes (
  id text PRIMARY KEY,            -- 'light' | 'dark'
  name text NOT NULL,             -- 'Светлая' | 'Тёмная'
  description text NOT NULL,
  preview_images text[] NOT NULL, -- 4-8 фото-превью
  active boolean DEFAULT true
);
```

#### `material_catalog`
```sql
CREATE TABLE material_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,          -- 'flooring' | 'doors' | 'decor' | 'plumbing' | 'lighting'
  subcategory text,                -- 'laminate' | 'quartz_vinyl' | ...
  name text NOT NULL,
  tariff text NOT NULL REFERENCES tariffs(id),
  color_scheme text NOT NULL REFERENCES color_schemes(id),
  price numeric NOT NULL,          -- закупочная цена (НЕ показываем клиенту)
  unit text NOT NULL,              -- 'sqm' | 'piece' | 'box'
  supplier_url text,               -- только для админки
  image_url text NOT NULL,
  notes text,
  client_choice boolean DEFAULT false,  -- true = клиент выбирает в этой категории
  display_order int DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
CREATE POLICY "Clients see public material info" ON material_catalog
  FOR SELECT TO authenticated
  USING (active = true);  -- но в SELECT хелпере фильтруем поля

-- Создать VIEW для клиентов без price/supplier_url:
CREATE VIEW material_catalog_public AS
  SELECT id, category, subcategory, name, tariff, color_scheme, 
         unit, image_url, notes, client_choice, display_order
  FROM material_catalog
  WHERE active = true;
```

#### `tariff_packages`
```sql
CREATE TABLE tariff_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tariff text NOT NULL REFERENCES tariffs(id),
  color_scheme text NOT NULL REFERENCES color_schemes(id),
  area_min int NOT NULL,
  area_max int NOT NULL,
  price numeric NOT NULL,
  active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (tariff, color_scheme, area_min, area_max)
);
```

#### `stage_dependencies`
```sql
CREATE TABLE stage_dependencies (
  from_stage_num text NOT NULL,    -- '0.1', '0.2', ..., '22'
  to_stage_num   text NOT NULL,
  rel_type text NOT NULL CHECK (rel_type IN ('parallel', 'partial', 'blocked')),
  notes text,
  PRIMARY KEY (from_stage_num, to_stage_num)
);
```

#### `stop_list_factors`
```sql
CREATE TABLE stop_list_factors (
  id text PRIMARY KEY,             -- 'replanning' | 'complex_ceilings' | ...
  label text NOT NULL,             -- русский текст для UI
  description text NOT NULL,       -- объяснение «почему стоп»
  blocks_project boolean DEFAULT true,
  display_order int
);
```

### Изменения существующих таблиц

#### `projects`
```sql
ALTER TABLE projects 
  DROP COLUMN budget,                          -- свободное число → не нужно
  ADD COLUMN tariff text REFERENCES tariffs(id),
  ADD COLUMN color_scheme text REFERENCES color_schemes(id),
  ADD COLUMN tariff_package_id uuid REFERENCES tariff_packages(id),
  ADD COLUMN total_price numeric NOT NULL DEFAULT 0,  -- зафиксированная цена пакета
  ADD COLUMN start_date date,
  ADD COLUMN deadline_date date,                       -- start + 30 дней
  ADD COLUMN material_choices jsonb DEFAULT '{}'::jsonb,  -- {category: material_id}
  ADD COLUMN contract_signed_at timestamptz,
  ADD COLUMN payment_status text DEFAULT 'pending',    -- 'pending' | 'partial' | 'paid'
  ADD COLUMN handover_pdf_url text;
```

#### `leads`
```sql
ALTER TABLE leads
  ADD COLUMN stop_factors jsonb DEFAULT '[]'::jsonb,  -- массив включённых факторов
  ADD COLUMN out_of_scope boolean DEFAULT false,
  ADD COLUMN consent_given_at timestamptz;
```

#### `stage_templates` (полная замена данных)
```sql
ALTER TABLE stage_templates
  ADD COLUMN num text UNIQUE,                  -- '0.1', '1', '2', ..., '22'
  ADD COLUMN category text,
  ADD COLUMN min_days int,
  ADD COLUMN dor text,
  ADD COLUMN dod text,
  ADD COLUMN requires_hidden_photos boolean DEFAULT false,
  ADD COLUMN quality_level text;               -- 'Q1' | 'Q2' | 'Q3' | 'Q4' (опц.)

-- Очистить и засеять 23 этапа из docs/v0.2/stages.md
```

## API Endpoints

### Edge Functions (новые / адаптация существующих)

#### `submit-lead` (изменения)
- Добавить поля `stopFactors`, `outOfScope`, `consentGivenAt`
- Если хотя бы один stop factor включён — `outOfScope = true`
- Email-уведомление менеджеру

#### `calculate-package-price` (новый)
**Запрос:**
```json
POST /functions/v1/calculate-package-price
{
  "tariff": "base",
  "color_scheme": "light",
  "area": 52,
  "materialChoices": { "flooring": "uuid-of-laminate" }
}
```
**Ответ:**
```json
{
  "tariff_package_id": "uuid",
  "price": 720000,
  "duration_days": 30,
  "start_date_estimate": "2026-05-15",
  "end_date_estimate": "2026-06-14",
  "included_materials": [...],
  "included_works": [...]
}
```

#### `create-project-draft` (новый)
Создаёт `projects` со статусом `draft` после `PackagePreviewScreen`.

#### `generate-contract-pdf` (новый)
Генерирует PDF-договор по проекту.

#### `sign-contract-init` (новый)
Отправляет SMS-код на телефон клиента.

#### `sign-contract-verify` (новый)
Проверяет SMS-код, ставит статус `pending_payment`, фиксирует `contract_signed_at`.

#### `payment-init` (новый)
Создаёт платёж в ЮКассе или возвращает реквизиты счёта.

#### `payment-webhook` (новый)
Webhook от платёжки → меняет статус проекта на `in_progress`, создаёт этапы из шаблона.

#### `generate-handover-pdf` (новый)
По завершению всех 23 этапов генерирует PDF «Папка владельца».

#### `submit-review` (новый)
Сохраняет отзыв клиента.

### REST/Supabase queries (через клиент)

| Назначение | Запрос |
|---|---|
| Список тарифов | `supabase.from('tariffs').select('*').eq('active', true)` |
| Список цветовых схем | `supabase.from('color_schemes').select('*').eq('active', true)` |
| Каталог материалов для тарифа+темы | `supabase.from('material_catalog_public').select('*').eq('tariff', ...).eq('color_scheme', ...)` |
| Цена пакета по площади | `supabase.from('tariff_packages').select('*').eq(...).gte('area_max', area).lte('area_min', area).single()` |
| Активный проект клиента | `supabase.from('projects').select('*, stages(*), supervisor:profiles!supervisor_id(*)').eq('client_id', auth.uid()).single()` |
| Сообщения чата | `supabase.from('chat_messages').select('*').eq('project_id', ...).order('created_at')` |

## RLS политики

### Новые

```sql
-- material_catalog: клиент видит только публичный VIEW
-- (price и supplier_url отсечены через VIEW)

CREATE POLICY "Clients read tariffs" ON tariffs FOR SELECT TO authenticated USING (active);
CREATE POLICY "Clients read color_schemes" ON color_schemes FOR SELECT TO authenticated USING (active);
CREATE POLICY "Clients read tariff_packages" ON tariff_packages FOR SELECT TO authenticated USING (active);
CREATE POLICY "Clients read stage_dependencies" ON stage_dependencies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Clients read stop_list_factors" ON stop_list_factors FOR SELECT TO anon, authenticated USING (true);

-- material_catalog: клиент НЕ видит price и supplier_url
-- → создан material_catalog_public VIEW (см. выше)

CREATE POLICY "Admins manage material_catalog" ON material_catalog
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Supervisors read material_catalog" ON material_catalog
  FOR SELECT TO authenticated
  USING (is_supervisor() OR is_admin());
```

### Изменённые

```sql
-- projects: добавить проверки на статус для UPDATE
CREATE POLICY "Clients update own draft projects" ON projects
  FOR UPDATE TO authenticated
  USING (client_id = auth.uid() AND status = 'draft')
  WITH CHECK (client_id = auth.uid());

-- projects: клиент может только READ свои проекты
CREATE POLICY "Clients read own projects" ON projects
  FOR SELECT TO authenticated
  USING (client_id = auth.uid());
```

## События (Realtime)

### Подписки клиента

| Канал | Когда обновляется UI |
|---|---|
| `projects:client_id=eq.{userId}` | Изменение статуса проекта (started, on_hold, completed) |
| `stages:project_id=eq.{projectId}` | Любое изменение этапа (status, photos, comments) |
| `chat_messages:project_id=eq.{projectId}` | Новое сообщение от супервайзера |
| `notifications:user_id=eq.{userId}` | Push-уведомления |

## Миграции (план)

```
041_v02_tariffs_and_packages.sql      — таблицы tariffs, color_schemes, tariff_packages, stop_list_factors
042_v02_material_catalog.sql          — material_catalog + VIEW + RLS
043_v02_stage_templates_v2.sql        — расширение stage_templates + 23 новых этапа
044_v02_stage_dependencies.sql        — stage_dependencies + сидирование матрицы
045_v02_projects_changes.sql          — alter projects (tariff, color_scheme, total_price, ...)
046_v02_leads_changes.sql             — alter leads (stop_factors, out_of_scope, consent)
047_v02_seed_tariffs.sql              — сидирование тарифов и схем
048_v02_seed_stop_list.sql            — сидирование стоп-факторов
```

## Открытые вопросы для разработки

1. **Платёжный провайдер** — ЮКасса, СБП, что-то ещё? Это влияет на `payment-init` Edge Function.
2. **PDF-генератор** — какая библиотека на стороне сервера? (puppeteer / pdfkit / weasyprint)
3. **SMS-сервис** — для подписи договора. SMS.ru? Twilio? Это влияет на `sign-contract-init`.
4. **Замер** — это отдельная таблица `surveys`? Или поля в `projects`? Кто заполняет (роль)?
5. **Папка владельца** — статичный шаблон или генерируется из данных проекта?
