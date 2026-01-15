import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, RefreshCw, CheckCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface VimeoError {
  id: string;
  created_at: string;
  metadata: {
    videoId: string;
    vimeoId: string;
    errorType: string;
    message: string;
    timestamp: string;
  };
}

export function VimeoErrorsList() {
  const [errors, setErrors] = useState<VimeoError[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function fetchErrors() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('action', 'vimeo_error')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Type assertion for the metadata
      const typedErrors = (data || []).map(item => ({
        id: item.id,
        created_at: item.created_at,
        metadata: item.metadata as VimeoError['metadata'],
      })).filter(item => item.metadata?.vimeoId);

      setErrors(typedErrors);
    } catch (error) {
      console.error('Error fetching Vimeo errors:', error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchErrors();
  }, []);

  const getErrorBadgeVariant = (errorType: string) => {
    switch (errorType) {
      case 'embed_blocked':
        return 'destructive';
      case 'csp_blocked':
        return 'destructive';
      case 'network_error':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getErrorTypeLabel = (errorType: string) => {
    switch (errorType) {
      case 'embed_blocked':
        return 'Domain blockiert';
      case 'csp_blocked':
        return 'CSP-Fehler';
      case 'network_error':
        return 'Netzwerk';
      default:
        return 'Unbekannt';
    }
  };

  // Group errors by vimeoId
  const errorsByVideo = errors.reduce((acc, error) => {
    const key = error.metadata.vimeoId;
    if (!acc[key]) {
      acc[key] = {
        vimeoId: key,
        videoId: error.metadata.videoId,
        count: 0,
        lastError: error,
        errorTypes: new Set<string>(),
      };
    }
    acc[key].count++;
    acc[key].errorTypes.add(error.metadata.errorType);
    return acc;
  }, {} as Record<string, { vimeoId: string; videoId: string; count: number; lastError: VimeoError; errorTypes: Set<string> }>);

  const videoErrors = Object.values(errorsByVideo).sort((a, b) => b.count - a.count);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Vimeo-Fehler
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Videos mit Embed-Problemen
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchErrors} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Aktualisieren
        </Button>
      </CardHeader>
      <CardContent>
        {/* Domain hint */}
        <div className="mb-4 p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Hinweis:</strong> Vimeo Embed Privacy prüfen für Domain:{' '}
            <code className="bg-background px-1 py-0.5 rounded text-xs">trumpetstar.lovable.app</code>
          </p>
          <a 
            href="https://vimeo.com/settings/videos" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline flex items-center gap-1 mt-2"
          >
            Vimeo Video-Einstellungen öffnen
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : videoErrors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
            <p className="text-muted-foreground">Keine Vimeo-Fehler in den letzten Logs</p>
          </div>
        ) : (
          <div className="space-y-3">
            {videoErrors.map((item) => (
              <div 
                key={item.vimeoId} 
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Video {item.vimeoId}</span>
                    {Array.from(item.errorTypes).map(type => (
                      <Badge key={type} variant={getErrorBadgeVariant(type)}>
                        {getErrorTypeLabel(type)}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.count} Fehler, zuletzt: {format(new Date(item.lastError.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                  </p>
                </div>
                <a
                  href={`https://vimeo.com/manage/${item.vimeoId}/privacy`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm flex items-center gap-1"
                >
                  Prüfen
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
