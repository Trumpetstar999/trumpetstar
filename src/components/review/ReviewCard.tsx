import { useState, useEffect } from 'react';
import { Star, ExternalLink, QrCode } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';

export function ReviewCard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [settings, setSettings] = useState<{
    google_review_url: string;
    google_review_qr_image: string | null;
  } | null>(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    supabase
      .from('review_settings')
      .select('google_review_url, google_review_qr_image')
      .eq('id', 'default')
      .single()
      .then(({ data }) => {
        if (data && data.google_review_url) {
          setSettings(data);
        }
      });
  }, []);

  if (!settings || !settings.google_review_url) return null;

  const handleClick = async () => {
    if (user) {
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: 'review_cta_clicked',
      });
    }
    window.open(settings.google_review_url, '_blank', 'noopener');
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-5">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
          <Star className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold text-sm">{t('review.title')}</h3>
          <p className="text-white/60 text-xs mt-0.5">{t('review.description')}</p>
        </div>
      </div>

      <button
        onClick={handleClick}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm transition-colors"
      >
        <ExternalLink className="w-4 h-4" />
        {t('review.ctaButton')}
      </button>

      {settings.google_review_qr_image && (
        <div className="mt-3 hidden lg:block">
          <button
            onClick={() => setShowQR(!showQR)}
            className="text-xs text-white/40 hover:text-white/60 flex items-center gap-1 transition-colors"
          >
            <QrCode className="w-3 h-3" />
            {showQR ? t('review.hideQR') : t('review.showQR')}
          </button>
          {showQR && (
            <div className="mt-2 flex justify-center">
              <img
                src={settings.google_review_qr_image}
                alt="Google Review QR Code"
                className="w-32 h-32 rounded-lg bg-white p-2"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
