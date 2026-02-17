
-- Auto-assign teacher Mario Schulter when a user gets PRO plan
CREATE OR REPLACE FUNCTION public.auto_assign_teacher_on_pro()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  default_teacher_id uuid := '7df5fd9d-3764-4bea-a179-2be95ca8061a';
  existing_assignment_id uuid;
BEGIN
  -- Only trigger when plan_key changes to PRO (or PREMIUM)
  IF NEW.plan_key IN ('PRO', 'PREMIUM') AND (OLD.plan_key IS NULL OR OLD.plan_key NOT IN ('PRO', 'PREMIUM')) THEN
    -- Check if user already has an active teacher assignment
    SELECT id INTO existing_assignment_id
    FROM teacher_assignments
    WHERE user_id = NEW.user_id AND is_active = true
    LIMIT 1;

    -- Only assign if no active assignment exists
    IF existing_assignment_id IS NULL THEN
      -- Deactivate any old assignments first
      UPDATE teacher_assignments
      SET is_active = false
      WHERE user_id = NEW.user_id AND is_active = true;

      -- Create new assignment
      INSERT INTO teacher_assignments (user_id, teacher_id, is_active)
      VALUES (NEW.user_id, default_teacher_id, true);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger to user_memberships table
DROP TRIGGER IF EXISTS trigger_auto_assign_teacher_on_pro ON user_memberships;
CREATE TRIGGER trigger_auto_assign_teacher_on_pro
AFTER INSERT OR UPDATE ON user_memberships
FOR EACH ROW
EXECUTE FUNCTION public.auto_assign_teacher_on_pro();
