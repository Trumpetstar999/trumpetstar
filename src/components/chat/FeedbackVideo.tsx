import { useEffect, useRef, useState } from 'react';
import { Loader2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { feedbackCopy } from '@/i18n/feedback';
import { useLanguage } from '@/hooks/useLanguage';

export function FeedbackVideo({ path }: { path: string }) {
  const { language } = useLanguage();
  const copy = feedbackCopy[language];
  const [url, setUrl] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const current = useRef(true);
  const objectUrl = useRef<string>();
  useEffect(() => {
    current.current = true;
    return () => { current.current = false; if (objectUrl.current) URL.revokeObjectURL(objectUrl.current); };
  }, []);
  const load = async () => {
    if (loading) return;
    setLoading(true); setError(false);
    try {
      const { data, error: failed } = await supabase.storage.from(path.startsWith('feedback/') ? 'feedback-videos' : 'recordings').download(path);
      if (failed || !data) throw failed;
      if (!current.current) return;
      objectUrl.current = URL.createObjectURL(data);
      setUrl(objectUrl.current);
    } catch { if (current.current) setError(true); }
    finally { if (current.current) setLoading(false); }
  };
  return <div className="w-64 max-w-full my-1">
    {url ? <video src={url} controls playsInline preload="metadata" className="w-full max-h-80 rounded-lg bg-ts-card" onError={() => setError(true)} /> : <Button variant="secondary" disabled={loading} onClick={() => void load()} className="w-full h-24 gap-2">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}{error ? copy.retry : copy.playVideo}</Button>}
    {error && <p role="alert" className="text-sm">{copy.videoFailed}</p>}
  </div>;
}