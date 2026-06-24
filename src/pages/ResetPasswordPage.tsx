import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Lock, Loader2, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import trumpetstarLogo from '@/assets/trumpetstar-logo.png';

type RecoveryState = 'checking' | 'ready' | 'invalid';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [recoveryState, setRecoveryState] = useState<RecoveryState>('checking');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        const hash = window.location.hash || '';
        const isRecoveryHash = hash.includes('type=recovery');
        const hasError = url.searchParams.get('error') || hash.includes('error=');

        if (hasError) {
          if (!cancelled) setRecoveryState('invalid');
          return;
        }

        // PKCE flow: exchange ?code= for a session
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!cancelled) {
            if (error) {
              console.error('exchangeCodeForSession error:', error);
              setRecoveryState('invalid');
            } else {
              // Clean the code from the URL so refresh won't try to re-exchange it
              window.history.replaceState({}, '', '/reset-password');
              setRecoveryState('ready');
            }
          }
          return;
        }

        // Implicit flow: tokens already in hash, supabase-js auto-detects
        if (isRecoveryHash) {
          // Give supabase-js a tick to parse the hash
          await new Promise((r) => setTimeout(r, 300));
          const { data } = await supabase.auth.getSession();
          if (!cancelled) setRecoveryState(data.session ? 'ready' : 'invalid');
          return;
        }

        // Maybe an active session already exists (e.g. user opened link in same browser)
        const { data } = await supabase.auth.getSession();
        if (!cancelled) setRecoveryState(data.session ? 'ready' : 'invalid');
      } catch (err) {
        console.error('Recovery init error:', err);
        if (!cancelled) setRecoveryState('invalid');
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setRecoveryState('ready');
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: t('auth.passwordTooShort'), description: t('auth.passwordTooShortDesc'), variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: t('auth.error'), description: 'Passwörter stimmen nicht überein.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: 'Passwort geändert', description: 'Dein Passwort wurde erfolgreich aktualisiert.' });
      navigate('/app');
    } catch (error) {
      toast({ title: t('auth.error'), description: error instanceof Error ? error.message : t('auth.unknownError'), variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src={trumpetstarLogo} alt="Trumpetstar" className="h-20 w-auto drop-shadow-lg" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Neues Passwort setzen</h1>
          <p className="text-white/70">
            {recoveryState === 'ready'
              ? 'Gib dein neues Passwort ein.'
              : recoveryState === 'invalid'
              ? 'Dieser Link ist ungültig oder abgelaufen.'
              : 'Link wird überprüft …'}
          </p>
        </div>

        <div className="card-glass rounded-2xl p-6 shadow-xl">
          {recoveryState === 'checking' && (
            <div className="flex items-center justify-center py-8 text-slate-600">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Bitte warten …
            </div>
          )}

          {recoveryState === 'invalid' && (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
              </div>
              <p className="text-slate-700 text-sm">
                Der Reset-Link ist nicht mehr gültig. Bitte fordere einen neuen Link an.
              </p>
              <Button
                type="button"
                className="w-full h-11 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                onClick={() => navigate('/auth')}
              >
                Zurück zum Login
              </Button>
            </div>
          )}

          {recoveryState === 'ready' && (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-slate-700 font-medium">Neues Passwort</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mindestens 6 Zeichen"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 pr-11 h-12 text-base border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-slate-700 font-medium">Passwort bestätigen</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nochmal eingeben"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-11 h-12 text-base border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md text-white"
                disabled={isLoading}
              >
                {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Speichern...</> : 'Passwort speichern'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
