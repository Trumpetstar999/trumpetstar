import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, UserPlus, Mail, Lock, User, Shield, Crown, GraduationCap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface Plan {
  key: string;
  display_name: string;
  rank: number;
}

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans: Plan[];
  onUserCreated: () => void | Promise<void>;
}

export function CreateUserDialog({ open, onOpenChange, plans, onUserCreated }: CreateUserDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<AppRole | 'none'>('none');
  const [planKey, setPlanKey] = useState('FREE');
  const [isTeacher, setIsTeacher] = useState(false);
  
  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setRole('none');
    setPlanKey('FREE');
    setIsTeacher(false);
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Clean and validate email
    const cleanEmail = email.trim().toLowerCase();
    
    if (!cleanEmail) {
      newErrors.email = 'E-Mail ist erforderlich';
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(cleanEmail)) {
      newErrors.email = 'Ungültige E-Mail-Adresse';
    } else if (cleanEmail.includes('..') || cleanEmail.startsWith('.') || cleanEmail.includes('.@') || cleanEmail.includes('@.')) {
      newErrors.email = 'Ungültige E-Mail-Adresse';
    }

    if (!password) {
      newErrors.password = 'Passwort ist erforderlich';
    } else if (password.length < 6) {
      newErrors.password = 'Mindestens 6 Zeichen';
    }

    if (!displayName.trim()) {
      newErrors.displayName = 'Name ist erforderlich';
    } else if (displayName.length > 100) {
      newErrors.displayName = 'Name zu lang (max. 100 Zeichen)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Keine gültige Sitzung');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=create-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
            displayName: displayName.trim(),
            role: role === 'none' ? null : role,
            planKey,
            isTeacher,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Fehler beim Erstellen des Nutzers');
      }

      toast({
        title: 'Nutzer erstellt',
        description: `${displayName} wurde erfolgreich angelegt.`,
      });

      // First refresh the user list, then close the dialog
      await onUserCreated();
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Nutzer konnte nicht erstellt werden.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value) resetForm();
      onOpenChange(value);
    }}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <UserPlus className="w-5 h-5" />
            Neuen Nutzer anlegen
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-700 flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" />
              E-Mail
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nutzer@beispiel.de"
              className={errors.email ? 'border-red-500' : ''}
              disabled={isLoading}
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-700 flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-400" />
              Passwort
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mindestens 6 Zeichen"
              className={errors.password ? 'border-red-500' : ''}
              disabled={isLoading}
            />
            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName" className="text-slate-700 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              Anzeigename
            </Label>
            <Input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Max Mustermann"
              className={errors.displayName ? 'border-red-500' : ''}
              disabled={isLoading}
            />
            {errors.displayName && <p className="text-xs text-red-500">{errors.displayName}</p>}
          </div>

          {/* Plan Selection */}
          <div className="space-y-2">
            <Label className="text-slate-700 flex items-center gap-2">
              <Crown className="w-4 h-4 text-slate-400" />
              Plan
            </Label>
            <Select value={planKey} onValueChange={setPlanKey} disabled={isLoading}>
              <SelectTrigger className="bg-white border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {plans.map((plan) => (
                  <SelectItem key={plan.key} value={plan.key}>
                    {plan.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label className="text-slate-700 flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-400" />
              Berechtigung
            </Label>
            <Select value={role} onValueChange={(value) => setRole(value as AppRole | 'none')} disabled={isLoading}>
              <SelectTrigger className="bg-white border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="none">Keine besondere</SelectItem>
                <SelectItem value="user">Nutzer</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Teacher Toggle */}
          <div className="flex items-center justify-between py-2">
            <Label className="text-slate-700 flex items-center gap-2 cursor-pointer">
              <GraduationCap className="w-4 h-4 text-slate-400" />
              Als Lehrer registrieren
            </Label>
            <Switch
              checked={isTeacher}
              onCheckedChange={setIsTeacher}
              disabled={isLoading}
            />
          </div>
        </form>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Abbrechen
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Erstelle...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Nutzer erstellen
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
