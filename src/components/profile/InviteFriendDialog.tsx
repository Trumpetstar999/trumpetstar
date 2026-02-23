import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Star, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface InviteFriendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TEXTS = {
  de: {
    title: 'Freund einladen',
    description: 'Lade einen Freund per E-Mail ein und erhalte 5 Sterne! ⭐',
    emailLabel: 'E-Mail-Adresse deines Freundes',
    emailPlaceholder: 'freund@beispiel.de',
    send: 'Einladung senden',
    sending: 'Wird gesendet...',
  },
  en: {
    title: 'Invite a friend',
    description: 'Invite a friend via email and earn 5 stars! ⭐',
    emailLabel: "Your friend's email address",
    emailPlaceholder: 'friend@example.com',
    send: 'Send invitation',
    sending: 'Sending...',
  },
  es: {
    title: 'Invitar a un amigo',
    description: '¡Invita a un amigo por email y gana 5 estrellas! ⭐',
    emailLabel: 'Correo electrónico de tu amigo',
    emailPlaceholder: 'amigo@ejemplo.com',
    send: 'Enviar invitación',
    sending: 'Enviando...',
  },
};

export function InviteFriendDialog({ open, onOpenChange }: InviteFriendDialogProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // Simple language detection from localStorage
  const lang = (localStorage.getItem('trumpetstar-language') || 'de') as keyof typeof TEXTS;
  const t = TEXTS[lang] || TEXTS.de;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Bitte melde dich zuerst an');
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const apikey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      const response = await fetch(`${supabaseUrl}/functions/v1/invite-friend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': apikey,
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      
      const result = await response.json();
      console.log('[InviteFriend] Response:', response.status, result);

      if (!response.ok || result.error) {
        toast.error(result.error || 'Fehler beim Senden der Einladung');
      } else {
        toast.success(result.message || 'Einladung gesendet! ⭐');
        setEmail('');
        onOpenChange(false);
      }
    } catch (err: any) {
      console.error('[InviteFriend] Error:', err);
      toast.error(err.message || 'Fehler beim Senden der Einladung');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            {t.title}
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          {t.description}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">{t.emailLabel}</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder={t.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t.sending}
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                {t.send}
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
