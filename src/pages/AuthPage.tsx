import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMiniMode } from '@/hooks/useMiniMode';
import { useLanguage } from '@/hooks/useLanguage';
import type { Language } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, User, Loader2, Eye, EyeOff } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import trumpetstarLogo from '@/assets/trumpetstar-logo.png';

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const navigate = useNavigate();
  const isMiniMode = useMiniMode();
  const location = useLocation();
  const { t, language, setLanguage } = useLanguage();
  const { toast } = useToast();
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);

  const getRedirectPath = () => {
    const returnTo = sessionStorage.getItem('returnTo');
    if (returnTo && returnTo.startsWith('/app')) {
      sessionStorage.removeItem('returnTo');
      return returnTo;
    }
    return isMiniMode ? '/mobile/home' : '/app';
  };

  // Check if already logged in
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate(getRedirectPath());
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate(getRedirectPath());
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: t('auth.emailRequired'), description: t('auth.emailRequiredDesc'), variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      // Detect browser language
      const browserLang = navigator.language?.substring(0, 2) || 'de';
      const locale = ['de', 'en', 'es'].includes(browserLang) ? browserLang : 'de';

      const { data, error } = await supabase.functions.invoke('send-magic-link', {
        body: {
          email: email.trim().toLowerCase(),
          locale,
          redirectTo: `${window.location.origin}/app`,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setMagicLinkSent(true);
      toast({
        title: t('auth.magicLinkSentToast'),
        description: t('auth.magicLinkSentToastDesc'),
      });
    } catch (error) {
      console.error('Magic link error:', error);
      toast({
        title: t('auth.error'),
        description: error instanceof Error ? error.message : t('auth.unknownError'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: t('auth.missingFields'), description: t('auth.missingFieldsDesc'), variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: t('auth.passwordTooShort'), description: t('auth.passwordTooShortDesc'), variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/app`,
          data: { display_name: displayName || email.split('@')[0] },
        },
      });
      if (error) {
        if (error.message.includes('already registered')) {
          toast({ title: t('auth.emailAlreadyRegistered'), description: t('auth.emailAlreadyRegisteredDesc'), variant: 'destructive' });
        } else {
          throw error;
        }
      } else {
        toast({ title: t('auth.signupSuccess'), description: t('auth.signupSuccessDesc') });
        navigate(getRedirectPath());
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast({ title: t('auth.signupFailed'), description: error instanceof Error ? error.message : t('auth.unknownError'), variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!email || !password) {
      setLoginError(t('auth.missingFieldsDesc'));
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setLoginError(t('auth.invalidCredentialsDesc'));
        } else {
          setLoginError(error.message);
        }
      } else {
        toast({ title: t('auth.welcomeBack'), description: t('auth.nowLoggedIn') });
        navigate(getRedirectPath());
      }
    } catch (error) {
      console.error('Signin error:', error);
      setLoginError(error instanceof Error ? error.message : t('auth.unknownError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setLoginError(t('auth.emailRequiredDesc'));
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setForgotPasswordSent(true);
      toast({ title: t('auth.forgotPassword'), description: t('auth.magicLinkSentToastDesc') });
    } catch (error) {
      console.error('Password reset error:', error);
      toast({ title: t('auth.error'), description: error instanceof Error ? error.message : t('auth.unknownError'), variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };


  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/app`,
      });
      if (error) {
        toast({
        title: t('auth.googleLoginFailed'),
          description: error.message || t('auth.unknownError'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast({
        title: t('auth.googleLoginFailed'),
        description: error instanceof Error ? error.message : t('auth.unknownError'),
        variant: 'destructive',
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsAppleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("apple", {
        redirect_uri: `${window.location.origin}/app`,
      });
      if (error) {
        toast({
        title: t('auth.appleLoginFailed'),
          description: error.message || t('auth.unknownError'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Apple sign-in error:', error);
      toast({
        title: t('auth.appleLoginFailed'),
        description: error instanceof Error ? error.message : t('auth.unknownError'),
        variant: 'destructive',
      });
    } finally {
      setIsAppleLoading(false);
    }
  };

  if (magicLinkSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md card-glass p-8 rounded-2xl text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img 
              src={trumpetstarLogo} 
              alt="Trumpetstar" 
              className="h-16 w-auto"
            />
          </div>
          
          {/* Icon */}
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mb-6 shadow-lg">
            <Mail className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-2xl font-bold text-slate-900 mb-3">
            {t('auth.magicLinkSentTitle')}
          </h1>
          <p className="text-slate-600 mb-6">
            {t('auth.magicLinkSentDesc', { email })}
          </p>
          
          <Button
            variant="outline"
            className="w-full h-12 text-base border-slate-300 text-slate-700 hover:bg-slate-100"
            onClick={() => setMagicLinkSent(false)}
          >
            {t('auth.backToLogin')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Language Switcher */}
        <div className="flex justify-end mb-4">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="bg-white/10 border border-white/20 text-white rounded-lg px-2 py-1 text-xs cursor-pointer backdrop-blur-sm hover:bg-white/20 transition-colors"
            title="Select language"
          >
            <option value="de">🇩🇪 DE</option>
            <option value="en">🇬🇧 EN</option>
            <option value="es">🇪🇸 ES</option>
            <option value="sl">🇸🇮 SL</option>
          </select>
        </div>
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src={trumpetstarLogo} 
              alt="Trumpetstar" 
              className="h-20 w-auto drop-shadow-lg"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-md">
            {t('auth.welcome')}
          </h1>
          <p className="text-white/80 text-lg">
            {t('auth.tagline')}
          </p>
        </div>

        {/* Auth Card */}
        <div className="card-glass rounded-2xl p-6 shadow-xl">
          {/* Social Login Buttons */}
          <div className="flex gap-3 mb-6">
            <Button 
              onClick={handleGoogleSignIn}
              variant="outline"
              className="flex-1 h-12 text-base font-medium gap-2 border-slate-200 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900"
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Google
            </Button>
            <Button 
              onClick={handleAppleSignIn}
              variant="outline"
              className="flex-1 h-12 text-base font-medium gap-2 border-slate-200 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900"
              disabled={isAppleLoading}
            >
              {isAppleLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
              )}
              Apple
            </Button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-slate-400 font-medium">{t('auth.orDivider')}</span>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue={location.pathname === '/signup' ? 'signup' : 'login'} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 rounded-xl h-12">
              <TabsTrigger 
                value="magic" 
                className="rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-600"
              >
                {t('auth.tabMagicLink')}
              </TabsTrigger>
              <TabsTrigger 
                value="login"
                className="rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-600"
              >
                {t('auth.tabLogin')}
              </TabsTrigger>
              <TabsTrigger 
                value="signup"
                className="rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-600"
              >
                {t('auth.tabRegister')}
              </TabsTrigger>
            </TabsList>

            {/* Magic Link Tab */}
            <TabsContent value="magic" className="mt-6">
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="magic-email" className="text-slate-700 font-medium">
                    {t('auth.emailLabel')}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="magic-email"
                      type="email"
                      placeholder={t('auth.emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-11 h-12 text-base border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2 py-1">
                  <Checkbox 
                    id="rememberMe-magic" 
                    checked={rememberMe} 
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)} 
                  />
                  <Label htmlFor="rememberMe-magic" className="text-sm font-medium text-slate-600 leading-none cursor-pointer">
                    {t('auth.rememberMe')}
                  </Label>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t('auth.sendingLink')}
                    </>
                  ) : (
                    t('auth.sendMagicLink')
                  )}
                </Button>
                <p className="text-sm text-slate-500 text-center">
                  {t('auth.magicLinkHint')}
                </p>
              </form>
            </TabsContent>

            {/* Login Tab */}
            <TabsContent value="login" className="mt-6">
              <form onSubmit={handleSignIn} className="space-y-4">
                {loginError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                    {loginError}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-slate-700 font-medium">
                    {t('auth.emailLabel')}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder={t('auth.emailPlaceholder')}
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setLoginError(null); }}
                      className="pl-11 h-12 text-base border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-slate-700 font-medium">
                    {t('auth.passwordLabel')}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t('auth.passwordPlaceholder')}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setLoginError(null); }}
                      className="pl-11 pr-11 h-12 text-base border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="rememberMe-login" 
                      checked={rememberMe} 
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)} 
                    />
                    <Label htmlFor="rememberMe-login" className="text-sm font-medium text-slate-600 leading-none cursor-pointer">
                      {t('auth.rememberMe')}
                    </Label>
                  </div>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
                  >
                    {t('auth.forgotPassword')}
                  </button>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t('auth.signingIn')}
                    </>
                  ) : (
                    t('auth.signIn')
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Signup Tab */}
            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-slate-700 font-medium">
                    {t('auth.displayNameLabel')} <span className="text-slate-400 font-normal">{t('auth.displayNameOptional')}</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder={t('auth.displayNamePlaceholder')}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="pl-11 h-12 text-base border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-slate-700 font-medium">
                    {t('auth.emailLabel')}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder={t('auth.emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-11 h-12 text-base border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-slate-700 font-medium">
                    {t('auth.passwordLabel')}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder={t('auth.passwordMinLength')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-11 h-12 text-base border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t('auth.registering')}
                    </>
                  ) : (
                    t('auth.createAccount')
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <p className="text-center text-white/60 text-sm mt-6">
          {t('auth.footer')}
        </p>
      </div>
    </div>
  );
}
