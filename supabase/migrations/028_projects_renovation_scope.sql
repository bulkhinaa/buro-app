-- =============================================
-- Добавляем колонку scope в таблицу projects
-- Хранит выбранные помещения для ремонта (массив значений RenovationScope)
-- Примеры значений: 'full', 'kitchen', 'bathroom', 'living_room', 'bedroom', 'hallway', 'balcony'
-- Если NULL или пустой массив — ремонт всей квартиры (full scope)
-- =============================================

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS scope TEXT[] NOT NULL DEFAULT '{}';

-- Индекс для быстрой фильтрации проектов по scope (например, найти все проекты с кухней)
-- GIN подходит для массивов — поддерживает операторы @>, &&, <@
CREATE INDEX IF NOT EXISTS idx_projects_scope ON projects USING GIN (scope);

-- Комментарий к колонке для документации схемы
COMMENT ON COLUMN projects.scope IS
  'Выбранные помещения для ремонта. Пустой массив = вся квартира (full). '
  'Возможные значения: full, kitchen, bathroom, living_room, bedroom, hallway, balcony';
