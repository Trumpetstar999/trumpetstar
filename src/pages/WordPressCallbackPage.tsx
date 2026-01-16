import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useWordPressMembership } from '@/hooks/useWordPressMembership';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function WordPressCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleOAuthCallback, error: membershipError } = useWordPressMembership();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (errorParam) {
        setError(errorDescription || errorParam);
        setStatus('error');
        return;
      }

      if (!code || !state) {
        setError('Fehlende OAuth-Parameter');
        setStatus('error');
        return;
      }

      const success = await handleOAuthCallback(code, state);
      
      if (success) {
        setStatus('success');
        // Redirect to home after short delay
        setTimeout(() => navigate('/'), 2000);
      } else {
        setStatus('error');
        setError(membershipError || 'OAuth-Authentifizierung fehlgeschlagen');
      }
    };

    processCallback();
  }, [searchParams, handleOAuthCallback, navigate, membershipError]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            {status === 'loading' && <Loader2 className="w-8 h-8 text-primary animate-spin" />}
            {status === 'success' && <CheckCircle className="w-8 h-8 text-green-500" />}
            {status === 'error' && <XCircle className="w-8 h-8 text-destructive" />}
          </div>
          <CardTitle className="text-2xl">
            {status === 'loading' && 'Anmeldung wird verarbeitet...'}
            {status === 'success' && 'Erfolgreich verbunden!'}
            {status === 'error' && 'Anmeldung fehlgeschlagen'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Bitte warte, während wir deine WordPress-Anmeldung verarbeiten.'}
            {status === 'success' && 'Du wirst gleich weitergeleitet...'}
            {status === 'error' && (error || 'Ein Fehler ist aufgetreten.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          {status === 'error' && (
            <div className="space-y-3 w-full">
              <Button onClick={() => navigate('/auth')} className="w-full">
                Zurück zur Anmeldung
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
                Erneut versuchen
              </Button>
            </div>
          )}
          {status === 'success' && (
            <Button onClick={() => navigate('/')} className="w-full">
              Zur App
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
