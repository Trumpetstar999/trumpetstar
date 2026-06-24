ALTER TABLE public.audio_levels ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) - 1 AS rn FROM public.audio_levels
)
UPDATE public.audio_levels al SET sort_order = ordered.rn FROM ordered WHERE al.id = ordered.id;
CREATE INDEX IF NOT EXISTS audio_levels_sort_order_idx ON public.audio_levels(sort_order);