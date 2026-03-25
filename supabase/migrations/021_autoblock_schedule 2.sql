-- =============================================
-- Auto-block master schedule slots when assigned to a stage
-- Sprint V, Task 14
--
-- When a master is assigned to a stage (master_id set):
--   1. Determine date range: started_at (or today) .. deadline
--   2. For each date in range, find master's working slots
--   3. Mark those slots as 'booked' with project_id + stage_id
--
-- When a master is unassigned (master_id cleared):
--   1. Release booked slots for that stage back to 'working'
-- =============================================

CREATE OR REPLACE FUNCTION autoblock_master_schedule()
RETURNS TRIGGER AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
  v_date DATE;
BEGIN
  -- =========================================
  -- CASE 1: Master UNASSIGNED (clear old bookings)
  -- =========================================
  IF OLD.master_id IS NOT NULL AND (NEW.master_id IS NULL OR NEW.master_id != OLD.master_id) THEN
    -- Release slots previously booked for this stage
    UPDATE master_schedule
      SET status = 'working', project_id = NULL, stage_id = NULL, updated_at = NOW()
      WHERE master_id = OLD.master_id
        AND stage_id = OLD.id
        AND status = 'booked';
  END IF;

  -- =========================================
  -- CASE 2: Master ASSIGNED (book slots)
  -- =========================================
  IF NEW.master_id IS NOT NULL AND (OLD.master_id IS NULL OR OLD.master_id != NEW.master_id) THEN
    -- Determine date range
    v_start_date := COALESCE(NEW.started_at::date, CURRENT_DATE);
    v_end_date := COALESCE(NEW.deadline, v_start_date + INTERVAL '7 days');

    -- Skip vacations: check master_vacations overlap
    -- For each date in range, book existing 'working' slots
    v_date := v_start_date;
    WHILE v_date <= v_end_date LOOP
      -- Skip if date falls within a vacation
      IF NOT EXISTS (
        SELECT 1 FROM master_vacations
        WHERE master_id = NEW.master_id
          AND v_date BETWEEN date_from AND date_to
      ) THEN
        -- Book all 'working' slots for this date
        UPDATE master_schedule
          SET status = 'booked', project_id = NEW.project_id, stage_id = NEW.id, updated_at = NOW()
          WHERE master_id = NEW.master_id
            AND date = v_date
            AND status = 'working';
      END IF;

      v_date := v_date + 1;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: fires when master_id changes on a stage
CREATE TRIGGER stage_autoblock_schedule
  AFTER UPDATE OF master_id ON stages
  FOR EACH ROW
  EXECUTE FUNCTION autoblock_master_schedule();

-- Also trigger on INSERT if master_id is set from the start
CREATE OR REPLACE FUNCTION autoblock_master_schedule_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
  v_date DATE;
BEGIN
  IF NEW.master_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_start_date := COALESCE(NEW.started_at::date, CURRENT_DATE);
  v_end_date := COALESCE(NEW.deadline, v_start_date + INTERVAL '7 days');

  v_date := v_start_date;
  WHILE v_date <= v_end_date LOOP
    IF NOT EXISTS (
      SELECT 1 FROM master_vacations
      WHERE master_id = NEW.master_id
        AND v_date BETWEEN date_from AND date_to
    ) THEN
      UPDATE master_schedule
        SET status = 'booked', project_id = NEW.project_id, stage_id = NEW.id, updated_at = NOW()
        WHERE master_id = NEW.master_id
          AND date = v_date
          AND status = 'working';
    END IF;
    v_date := v_date + 1;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER stage_autoblock_schedule_insert
  AFTER INSERT ON stages
  FOR EACH ROW
  EXECUTE FUNCTION autoblock_master_schedule_insert();
