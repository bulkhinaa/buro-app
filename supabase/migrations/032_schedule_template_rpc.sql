-- SEC-5: Atomic replace of schedule templates via RPC function.
-- Replaces the non-atomic DELETE + INSERT pattern in scheduleStore.saveTemplate()
-- with a single transactional function call.

CREATE OR REPLACE FUNCTION replace_schedule_template(
  p_master_id UUID,
  p_slots JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Authorization check: caller must be the master themselves or an admin
  IF auth.uid() != p_master_id
    AND NOT EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  THEN
    RAISE EXCEPTION 'Unauthorized: only the master or an admin can replace schedule templates';
  END IF;

  -- Delete all existing template slots for this master
  DELETE FROM master_schedule_templates
  WHERE master_id = p_master_id;

  -- Insert new slots from the JSONB array
  -- Expected format: [{"day": 0, "hour": 8}, {"day": 1, "hour": 9}, ...]
  IF p_slots IS NOT NULL AND jsonb_array_length(p_slots) > 0 THEN
    INSERT INTO master_schedule_templates (master_id, day_of_week, hour, is_working)
    SELECT
      p_master_id,
      (slot->>'day')::smallint,
      (slot->>'hour')::smallint,
      true
    FROM jsonb_array_elements(p_slots) AS slot;
  END IF;
END;
$$;
