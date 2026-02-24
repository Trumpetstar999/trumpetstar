
-- FAQ items table for Help Center
CREATE TABLE public.faq_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL DEFAULT 'general',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  question_de TEXT NOT NULL DEFAULT '',
  answer_de TEXT NOT NULL DEFAULT '',
  question_en TEXT,
  answer_en TEXT,
  question_es TEXT,
  answer_es TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

-- Anyone can read active FAQ items (public help center)
CREATE POLICY "Anyone can read active faq items"
ON public.faq_items FOR SELECT
USING (is_active = true);

-- Admins can manage all FAQ items
CREATE POLICY "Admins can manage faq items"
ON public.faq_items FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Auto-update timestamp trigger
CREATE TRIGGER update_faq_items_updated_at
BEFORE UPDATE ON public.faq_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
