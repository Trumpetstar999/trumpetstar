import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function QRRedirectPage() {
  const { code } = useParams<{ code: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate(`/auth?redirect=/qr/${code}`, { replace: true });
      return;
    }

    if (!code) {
      setError('Kein QR-Code angegeben.');
      return;
    }

    (async () => {
      const { data, error: fetchError } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .maybeSingle();

      if (fetchError || !data) {
        setError('Ungültiger oder inaktiver QR-Code.');
        return;
      }

      if (data.content_type === 'video' && data.video_id) {
        // Fetch vimeo_video_id from videos table
        const { data: video } = await supabase
          .from('videos')
          .select('vimeo_video_id')
          .eq('id', data.video_id)
          .single();

        if (video?.vimeo_video_id) {
          navigate(`/app?qr_video=${video.vimeo_video_id}`, { replace: true });
        } else {
          setError('Video nicht gefunden.');
        }
      } else if (data.content_type === 'audio' && data.audio_id) {
        navigate(`/app?qr_audio=${data.audio_id}`, { replace: true });
      } else {
        setError('Kein Inhalt verknüpft.');
      }
    })();
  }, [user, authLoading, code, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 p-8">
          <p className="text-lg text-destructive font-medium">{error}</p>
          <button
            onClick={() => navigate('/app')}
            className="text-primary underline"
          >
            Zur App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
