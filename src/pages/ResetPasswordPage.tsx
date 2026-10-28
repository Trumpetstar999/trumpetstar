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
import { hasRecoveryCallback } from '@/lib/recovery';

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
    let recoveryDetected = false;
    const isRecoverySession = (userId: string | undefined) => Boolean(userId && sessionStorage.getItem('password_recovery_user') === userId);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        recoveryDetected = true;
        if (!cancelled) setRecoveryState('ready');
      }
    });

    const init = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        const hash = window.location.hash || '';
        const isRecoveryHash = hasRecoveryCallback(url);
        const tokenHash = url.searchParams.get('token_hash');
        const hasError = url.searchParams.get('error') || hash.includes('error=');

        if (hasError) {
          if (!cancelled) setRecoveryState('invalid');
          return;
        }

        if (tokenHash && url.searchParams.get('type') === 'recovery') {
          const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' });
          if (!cancelled) setRecoveryState(error ? 'invalid' : 'ready');
          window.history.replaceState({}, '', '/reset-password');
          return;
        }

        // Let SDK auto-initialization finish first: it may already consume the code.
        if (code) {
          const { data } = await supabase.auth.getSession();
          const consumed = !new URL(window.location.href).searchParams.has('code');
          if (consumed) {
            if (!cancelled) setRecoveryState(data.session && (recoveryDetected || isRecoverySession(data.session.user.id)) ? 'ready' : 'invalid');
            return;
          }
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

        // Implicit tokens are consumed by the SDK; getSession waits for initialization.
        if (isRecoveryHash) {
          const { data } = await supabase.auth.getSession();
          if (!cancelled) setRecoveryState(data.session ? 'ready' : 'invalid');
          return;
        }

        const { data } = await supabase.auth.getSession();
        if (!cancelled) setRecoveryState(recoveryDetected || isRecoverySession(data.session?.user.id) ? 'ready' : 'invalid');
      } catch (err) {
        console.error('Recovery init error:', err);
        if (!cancelled) setRecoveryState('invalid');
      }
    };

    init();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (recoveryState !== 'ready') return;
    if (password.length < 6) {
      toast({ title: t('auth.passwordTooShort'), description: t('auth.passwordTooShortDesc'), variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: t('auth.error'), description: t('auth.passwordMismatch'), variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      sessionStorage.removeItem('password_recovery_user');
      toast({ title: t('auth.passwordChanged'), description: t('auth.passwordChangedDesc') });
      navigate('/app');
    } catch (error) {
      toast({ title: t('auth.error'), description: error instanceof Error ? error.message : t('auth.unknownError'), variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-6 text-foreground">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src={trumpetstarLogo} alt="Trumpetstar" className="h-20 w-auto drop-shadow-lg" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{t('auth.resetTitle')}</h1>
          <p className="text-muted-foreground">
            {recoveryState === 'ready'
              ? t('auth.resetPrompt')
              : recoveryState === 'invalid'
              ? t('auth.resetInvalid')
              : t('auth.resetChecking')}
          </p>
        </div>

        <div className="bg-card text-card-foreground border rounded-lg p-6 shadow-xl">
          {recoveryState === 'checking' && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> {t('auth.resetChecking')}
            </div>
          )}

          {recoveryState === 'invalid' && (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
              </div>
              <p className="text-card-foreground text-sm">
                {t('auth.resetRequestNew')}
              </p>
              <Button
                type="button"
                className="w-full h-11"
                onClick={() => navigate('/auth')}
              >
                {t('auth.backToLogin')}
              </Button>
            </div>
          )}

          {recoveryState === 'ready' && (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="font-medium">{t('auth.newPassword')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('auth.passwordMinLength')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 pr-11 h-12 text-base text-card-foreground"
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t('auth.showPassword')}
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="font-medium">{t('auth.confirmPassword')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('auth.confirmPassword')}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-11 h-12 text-base text-card-foreground"
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold"
                disabled={isLoading}
              >
                {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t('auth.savingPassword')}</> : t('auth.savePassword')}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
