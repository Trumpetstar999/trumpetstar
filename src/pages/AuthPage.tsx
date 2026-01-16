import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, User, Loader2, ExternalLink, Sparkles } from 'lucide-react';
import { useWordPressMembership } from '@/hooks/useWordPressMembership';
import trumpetstarLogo from '@/assets/trumpetstar-logo.png';

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { startOAuthFlow, isLoading: isWpLoading, error: wpError } = useWordPressMembership();

  // Check if already logged in
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate('/');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: 'E-Mail erforderlich',
        description: 'Bitte gib deine E-Mail-Adresse ein.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      setMagicLinkSent(true);
      toast({
        title: 'Magic Link gesendet!',
        description: 'Überprüfe deine E-Mails und klicke auf den Link zum Einloggen.',
      });
    } catch (error) {
      console.error('Magic link error:', error);
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: 'Fehlende Angaben',
        description: 'Bitte gib E-Mail und Passwort ein.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Passwort zu kurz',
        description: 'Das Passwort muss mindestens 6 Zeichen lang sein.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            display_name: displayName || email.split('@')[0],
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast({
            title: 'E-Mail bereits registriert',
            description: 'Diese E-Mail-Adresse ist bereits registriert. Bitte logge dich ein.',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: 'Registrierung erfolgreich!',
          description: 'Du bist jetzt eingeloggt.',
        });
        navigate('/');
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: 'Registrierung fehlgeschlagen',
        description: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: 'Fehlende Angaben',
        description: 'Bitte gib E-Mail und Passwort ein.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: 'Ungültige Anmeldedaten',
            description: 'E-Mail oder Passwort ist falsch.',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: 'Willkommen zurück!',
          description: 'Du bist jetzt eingeloggt.',
        });
        navigate('/');
      }
    } catch (error) {
      console.error('Signin error:', error);
      toast({
        title: 'Anmeldung fehlgeschlagen',
        description: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWordPressLogin = async () => {
    try {
      await startOAuthFlow();
    } catch (error) {
      toast({
        title: 'WordPress Login fehlgeschlagen',
        description: wpError || 'Ein Fehler ist aufgetreten.',
        variant: 'destructive',
      });
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
            E-Mail gesendet!
          </h1>
          <p className="text-slate-600 mb-6">
            Wir haben dir einen Magic Link an <strong className="text-slate-900">{email}</strong> gesendet.
            Klicke auf den Link in der E-Mail, um dich einzuloggen.
          </p>
          
          <Button
            variant="outline"
            className="w-full h-12 text-base border-slate-300 text-slate-700 hover:bg-slate-100"
            onClick={() => setMagicLinkSent(false)}
          >
            Zurück zur Anmeldung
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
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
            Willkommen
          </h1>
          <p className="text-white/80 text-lg">
            Melde dich an, um deine Lernreise fortzusetzen
          </p>
        </div>

        {/* Auth Card */}
        <div className="card-glass rounded-2xl p-6 shadow-xl">
          {/* WordPress SSO Button - Primary CTA */}
          <div className="mb-6">
            <Button 
              onClick={handleWordPressLogin} 
              className="w-full h-14 text-base font-semibold gap-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all"
              size="lg"
              disabled={isWpLoading}
            >
              {isWpLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Verbinde...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Mit Trumpetstar-Konto anmelden
                </>
              )}
            </Button>
            <p className="text-sm text-slate-500 text-center mt-2">
              Nutze dein bestehendes Konto mit allen Mitgliedschaftsvorteilen
            </p>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-slate-400 font-medium">oder</span>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 rounded-xl h-12">
              <TabsTrigger 
                value="magic" 
                className="rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-600"
              >
                Magic Link
              </TabsTrigger>
              <TabsTrigger 
                value="login"
                className="rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-600"
              >
                Login
              </TabsTrigger>
              <TabsTrigger 
                value="signup"
                className="rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-600"
              >
                Registrieren
              </TabsTrigger>
            </TabsList>

            {/* Magic Link Tab */}
            <TabsContent value="magic" className="mt-6">
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="magic-email" className="text-slate-700 font-medium">
                    E-Mail-Adresse
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="magic-email"
                      type="email"
                      placeholder="deine@email.de"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
                      Sende Link...
                    </>
                  ) : (
                    'Magic Link senden'
                  )}
                </Button>
                <p className="text-sm text-slate-500 text-center">
                  Du erhältst einen Link per E-Mail, mit dem du dich ohne Passwort einloggen kannst.
                </p>
              </form>
            </TabsContent>

            {/* Login Tab */}
            <TabsContent value="login" className="mt-6">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-slate-700 font-medium">
                    E-Mail-Adresse
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="deine@email.de"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-11 h-12 text-base border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-slate-700 font-medium">
                    Passwort
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
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
                      Anmelden...
                    </>
                  ) : (
                    'Anmelden'
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Signup Tab */}
            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-slate-700 font-medium">
                    Anzeigename <span className="text-slate-400 font-normal">(optional)</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Dein Name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="pl-11 h-12 text-base border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-slate-700 font-medium">
                    E-Mail-Adresse
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="deine@email.de"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-11 h-12 text-base border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-slate-700 font-medium">
                    Passwort
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Mindestens 6 Zeichen"
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
                      Registrieren...
                    </>
                  ) : (
                    'Konto erstellen'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <p className="text-center text-white/60 text-sm mt-6">
          Mit der Anmeldung akzeptierst du unsere Nutzungsbedingungen
        </p>
      </div>
    </div>
  );
}
