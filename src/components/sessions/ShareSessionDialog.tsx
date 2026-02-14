import { useState } from 'react';
import { usePracticeSessions } from '@/hooks/usePracticeSessions';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ShareSessionDialogProps {
  sessionId: string;
  onClose: () => void;
}

export function ShareSessionDialog({ sessionId, onClose }: ShareSessionDialogProps) {
  const { generateShareSlug, sessions } = usePracticeSessions();
  const [shareUrl, setShareUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const session = sessions.find(s => s.id === sessionId);
  const existingSlug = session?.share_slug;

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const slug = await generateShareSlug(sessionId);
      const url = `${window.location.origin}/practice/sessions/share/${slug}`;
      setShareUrl(url);
    } catch (e: any) {
      toast({ title: 'Fehler', description: e.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl || `${window.location.origin}/practice/sessions/share/${existingSlug}`);
    setCopied(true);
    toast({ title: 'Link kopiert!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const displayUrl = shareUrl || (existingSlug ? `${window.location.origin}/practice/sessions/share/${existingSlug}` : '');

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Session teilen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {displayUrl ? (
            <div className="flex gap-2">
              <Input value={displayUrl} readOnly className="flex-1 text-xs" />
              <Button size="icon" variant="outline" onClick={handleCopy}>
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-4">
                Erstelle einen Share-Link, den andere kopieren können.
              </p>
              <Button onClick={handleGenerate} disabled={generating}>
                {generating ? 'Erstelle...' : 'Share-Link erstellen'}
              </Button>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Empfänger können die Session ansehen und eine eigene Kopie erstellen.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
