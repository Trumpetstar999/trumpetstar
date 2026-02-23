import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserInvited: () => void | Promise<void>;
}

export function InviteUserDialog({ open, onOpenChange, onUserInvited }: InviteUserDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const resetForm = () => {
    setEmail('');
    setError('');
  };

  const validate = (): boolean => {
    const clean = email.trim().toLowerCase();
    if (!clean) {
      setError('E-Mail ist erforderlich');
      return false;
    }
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(clean)) {
      setError('Ungültige E-Mail-Adresse');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Keine gültige Sitzung');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=invite-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Fehler beim Einladen');
      }

      toast({
        title: result.emailSent ? 'Einladung versendet' : 'Nutzer erstellt',
        description: result.emailSent
          ? `Eine Einladungs-E-Mail wurde an ${email.trim()} gesendet.`
          : result.message,
      });

      await onUserInvited();
      resetForm();
      onOpenChange(false);
    } catch (err) {
      console.error('Error inviting user:', err);
      toast({
        title: 'Fehler',
        description: err instanceof Error ? err.message : 'Einladung konnte nicht gesendet werden.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <Send className="w-5 h-5" />
            Nutzer einladen
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email" className="text-slate-700 flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" />
              E-Mail-Adresse
            </Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nutzer@beispiel.de"
              className={error ? 'border-red-500' : ''}
              disabled={isLoading}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
          <p className="text-xs text-slate-500">
            Der Nutzer erhält eine E-Mail mit einem Login-Link und kann sich direkt einloggen.
          </p>
        </form>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Abbrechen
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sende...</>
            ) : (
              <><Send className="w-4 h-4 mr-2" />Einladung senden</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
