-- Create feature flags table for menu visibility
CREATE TABLE public.feature_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Everyone can read feature flags (needed for menu rendering)
CREATE POLICY "Feature flags are readable by everyone"
ON public.feature_flags
FOR SELECT
USING (true);

-- Only admins can modify feature flags
CREATE POLICY "Admins can manage feature flags"
ON public.feature_flags
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_feature_flags_updated_at
BEFORE UPDATE ON public.feature_flags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default menu items
INSERT INTO public.feature_flags (key, display_name, description, is_enabled, sort_order) VALUES
('menu_home', 'Home/Dashboard', 'Startseite mit Dashboard-Widgets', true, 1),
('menu_levels', 'Levels/Kurse', 'Video-Kurse und Lektionen', true, 2),
('menu_pdfs', 'PDFs/Noten', 'PDF-Dokumente und Notenblätter', true, 3),
('menu_musicxml', 'MusicXML', 'Interaktive Notenansicht', true, 4),
('menu_recordings', 'Aufnahmen', 'Eigene Video-Aufnahmen', true, 5),
('menu_practice', 'Üben', 'Übungstagebuch und Todos', true, 6),
('menu_chats', 'Chats', 'Lehrer-Feedback und Nachrichten', true, 7),
('menu_classroom', 'Klassenzimmer', 'Live-Unterricht und Räume', true, 8),
('menu_profile', 'Profil', 'Benutzerprofil und Einstellungen', true, 9);