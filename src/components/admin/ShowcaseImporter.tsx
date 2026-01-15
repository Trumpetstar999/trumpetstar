import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Download, Loader2, RefreshCw, Eye, EyeOff, Check } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Showcase {
  id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  is_imported: boolean;
  is_active: boolean;
}

interface ShowcaseImporterProps {
  onImportComplete: () => void;
}

export function ShowcaseImporter({ onImportComplete }: ShowcaseImporterProps) {
  const [showcases, setShowcases] = useState<Showcase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetched, setIsFetched] = useState(false);
  const [importingIds, setImportingIds] = useState<Set<string>>(new Set());
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [isImportingAll, setIsImportingAll] = useState(false);

  const notImportedShowcases = showcases.filter((s) => !s.is_imported);

  async function fetchShowcases() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('vimeo-sync', {
        body: { action: 'list-showcases' },
      });

      if (error) throw error;

      if (data?.showcases) {
        setShowcases(data.showcases);
        setIsFetched(true);
        toast.success(`${data.showcases.length} Showcases gefunden`);
      }
    } catch (error) {
      console.error('Error fetching showcases:', error);
      toast.error('Fehler beim Laden der Showcases');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleImport(showcase: Showcase) {
    setImportingIds((prev) => new Set(prev).add(showcase.id));
    try {
      const { data, error } = await supabase.functions.invoke('vimeo-sync', {
        body: {
          action: 'import',
          showcaseUrl: `https://vimeo.com/showcase/${showcase.id}`,
        },
      });

      if (error) throw error;

      toast.success(`"${showcase.name}" importiert mit ${data.videosAdded} Videos`);
      
      // Update local state
      setShowcases((prev) =>
        prev.map((s) =>
          s.id === showcase.id ? { ...s, is_imported: true, is_active: true } : s
        )
      );
      
      onImportComplete();
    } catch (error) {
      console.error('Error importing showcase:', error);
      toast.error(`Fehler beim Importieren von "${showcase.name}"`);
      throw error; // Re-throw for importAll to catch
    } finally {
      setImportingIds((prev) => {
        const next = new Set(prev);
        next.delete(showcase.id);
        return next;
      });
    }
  }

  async function handleImportAll() {
    if (notImportedShowcases.length === 0) {
      toast.info('Alle Showcases sind bereits importiert');
      return;
    }

    setIsImportingAll(true);
    let successCount = 0;
    let errorCount = 0;

    for (const showcase of notImportedShowcases) {
      try {
        await handleImport(showcase);
        successCount++;
      } catch {
        errorCount++;
      }
    }

    setIsImportingAll(false);
    
    if (errorCount === 0) {
      toast.success(`Alle ${successCount} Showcases erfolgreich importiert`);
    } else {
      toast.warning(`${successCount} importiert, ${errorCount} fehlgeschlagen`);
    }
  }

  async function handleToggleVisibility(showcase: Showcase) {
    setTogglingIds((prev) => new Set(prev).add(showcase.id));
    try {
      // Find the level by vimeo_showcase_id
      const { data: level, error: fetchError } = await supabase
        .from('levels')
        .select('id, is_active')
        .eq('vimeo_showcase_id', showcase.id)
        .single();

      if (fetchError || !level) {
        throw new Error('Level nicht gefunden');
      }

      const { error: updateError } = await supabase
        .from('levels')
        .update({ is_active: !level.is_active })
        .eq('id', level.id);

      if (updateError) throw updateError;

      // Update local state
      setShowcases((prev) =>
        prev.map((s) =>
          s.id === showcase.id ? { ...s, is_active: !level.is_active } : s
        )
      );

      toast.success(
        level.is_active
          ? `"${showcase.name}" ist jetzt privat`
          : `"${showcase.name}" ist jetzt öffentlich`
      );
      
      onImportComplete();
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast.error('Fehler beim Ändern der Sichtbarkeit');
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(showcase.id);
        return next;
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Vimeo Showcases importieren</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Alle Showcases aus deinem Vimeo-Konto laden und als Levels importieren
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isFetched && notImportedShowcases.length > 0 && (
            <Button
              onClick={handleImportAll}
              disabled={isImportingAll || isLoading}
              className="gap-2"
            >
              {isImportingAll ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Alle importieren ({notImportedShowcases.length})
            </Button>
          )}
          <Button onClick={fetchShowcases} disabled={isLoading || isImportingAll} variant="outline" className="gap-2">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {isFetched ? 'Aktualisieren' : 'Showcases laden'}
          </Button>
        </div>
      </div>

      {isFetched && (
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-3">
            {showcases.map((showcase) => (
              <div
                key={showcase.id}
                className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card"
              >
                {/* Thumbnail */}
                {showcase.thumbnail_url ? (
                  <img
                    src={showcase.thumbnail_url}
                    alt={showcase.name}
                    className="w-24 h-14 object-cover rounded-md"
                  />
                ) : (
                  <div className="w-24 h-14 bg-muted rounded-md flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">Kein Bild</span>
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{showcase.name}</span>
                    {showcase.is_imported && (
                      <Badge variant={showcase.is_active ? 'default' : 'secondary'}>
                        {showcase.is_active ? 'Öffentlich' : 'Privat'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">ID: {showcase.id}</p>
                  {showcase.description && (
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {showcase.description}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  {showcase.is_imported ? (
                    <>
                      <div className="flex items-center gap-2">
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                        <Switch
                          checked={showcase.is_active}
                          onCheckedChange={() => handleToggleVisibility(showcase)}
                          disabled={togglingIds.has(showcase.id)}
                        />
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <Badge variant="outline" className="gap-1">
                        <Check className="w-3 h-3" />
                        Importiert
                      </Badge>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleImport(showcase)}
                      disabled={importingIds.has(showcase.id)}
                      className="gap-2"
                    >
                      {importingIds.has(showcase.id) ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      Importieren
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {showcases.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                Keine Showcases in deinem Vimeo-Konto gefunden
              </div>
            )}
          </div>
        </ScrollArea>
      )}

      {!isFetched && (
        <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
          Klicke auf "Showcases laden" um alle verfügbaren Showcases anzuzeigen
        </div>
      )}
    </div>
  );
}
