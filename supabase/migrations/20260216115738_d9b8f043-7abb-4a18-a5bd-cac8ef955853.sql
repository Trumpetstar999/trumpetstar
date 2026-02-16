
-- Create email_templates table for editable, multilingual email templates
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text NOT NULL UNIQUE,
  display_name text NOT NULL,
  subject_de text NOT NULL DEFAULT '',
  subject_en text NOT NULL DEFAULT '',
  subject_es text NOT NULL DEFAULT '',
  body_html_de text NOT NULL DEFAULT '',
  body_html_en text NOT NULL DEFAULT '',
  body_html_es text NOT NULL DEFAULT '',
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email templates"
  ON public.email_templates FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read email templates"
  ON public.email_templates FOR SELECT
  USING (true);

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default magic link template
INSERT INTO public.email_templates (template_key, display_name, description, subject_de, subject_en, subject_es, body_html_de, body_html_en, body_html_es)
VALUES (
  'magic_link',
  'Magic Link Login',
  'E-Mail die beim Magic-Link-Login versendet wird',
  'Dein Login-Link für Trumpetstar',
  'Your Login Link for Trumpetstar',
  'Tu enlace de inicio de sesión para Trumpetstar',
  '<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #ffffff; border-radius: 12px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #1e293b; font-size: 22px; margin: 0;">🎺 Trumpetstar</h1>
    </div>
    <p style="color: #334155; font-size: 16px; line-height: 1.6;">Hallo,</p>
    <p style="color: #334155; font-size: 16px; line-height: 1.6;">Klicke auf den Button unten, um dich sicher mit deinem Einmal-Link einzuloggen:</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="{{magic_link}}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Einloggen</a>
    </div>
    <p style="color: #94a3b8; font-size: 14px; line-height: 1.5;">Falls du diesen Link nicht angefordert hast, kannst du diese E-Mail einfach ignorieren.</p>
  </div>',
  '<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #ffffff; border-radius: 12px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #1e293b; font-size: 22px; margin: 0;">🎺 Trumpetstar</h1>
    </div>
    <p style="color: #334155; font-size: 16px; line-height: 1.6;">Hello,</p>
    <p style="color: #334155; font-size: 16px; line-height: 1.6;">Click the button below to log in securely using your one-time link:</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="{{magic_link}}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Log In</a>
    </div>
    <p style="color: #94a3b8; font-size: 14px; line-height: 1.5;">If you didn''t request this, you can safely ignore this email.</p>
  </div>',
  '<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #ffffff; border-radius: 12px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #1e293b; font-size: 22px; margin: 0;">🎺 Trumpetstar</h1>
    </div>
    <p style="color: #334155; font-size: 16px; line-height: 1.6;">Hola,</p>
    <p style="color: #334155; font-size: 16px; line-height: 1.6;">Haz clic en el botón de abajo para iniciar sesión de forma segura con tu enlace de un solo uso:</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="{{magic_link}}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Iniciar sesión</a>
    </div>
    <p style="color: #94a3b8; font-size: 14px; line-height: 1.5;">Si no solicitaste este enlace, puedes ignorar este correo electrónico.</p>
  </div>'
);
