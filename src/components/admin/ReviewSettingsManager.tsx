import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Save, Star, Link, Image, ToggleRight } from 'lucide-react';

interface ReviewSettings {
  google_review_url: string;
  google_review_qr_image: string | null;
  enable_review_prompt: boolean;
  min_days_since_signup: number;
  min_videos_completed: number;
  cooldown_days: number;
}

export function ReviewSettingsManager() {
  const [settings, setSettings] = useState<ReviewSettings>({
    google_review_url: '',
    google_review_qr_image: null,
    enable_review_prompt: true,
    min_days_since_signup: 7,
    min_videos_completed: 10,
    cooldown_days: 60,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('review_settings')
      .select('*')
      .eq('id', 'default')
      .single();
    if (data) {
      setSettings({
        google_review_url: data.google_review_url,
        google_review_qr_image: data.google_review_qr_image,
        enable_review_prompt: data.enable_review_prompt,
        min_days_since_signup: data.min_days_since_signup,
        min_videos_completed: data.min_videos_completed,
        cooldown_days: data.cooldown_days,
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('review_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 'default');

    if (error) {
      toast.error('Fehler beim Speichern');
    } else {
      toast.success('Review-Einstellungen gespeichert');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="admin-card p-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Star className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Google Reviews</h3>
            <p className="text-sm text-slate-500">
              Konfiguriere den Google Review Link und die Prompt-Regeln
            </p>
          </div>
        </div>
      </div>

      {/* Google Review URL */}
      <div className="admin-card p-6 space-y-4">
        <h4 className="font-semibold text-slate-900 flex items-center gap-2">
          <Link className="w-4 h-4 text-blue-500" />
          Google Review Link
        </h4>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Google Review URL (Pflicht)
          </label>
          <input
            type="url"
            value={settings.google_review_url}
            onChange={(e) => setSettings({ ...settings, google_review_url: e.target.value })}
            placeholder="https://search.google.com/local/writereview?placeid=PLACE_ID"
            className="admin-input w-full"
          />
          <p className="text-xs text-slate-400 mt-1">
            Kopiere den Link aus Google Business Profile → „Mehr Rezensionen erhalten" oder nutze einen PlaceID-Link.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            <Image className="w-4 h-4 inline mr-1" />
            QR-Code Bild URL (optional)
          </label>
          <input
            type="url"
            value={settings.google_review_qr_image || ''}
            onChange={(e) => setSettings({ ...settings, google_review_qr_image: e.target.value || null })}
            placeholder="https://example.com/qr-code.png"
            className="admin-input w-full"
          />
          <p className="text-xs text-slate-400 mt-1">
            Optional: URL zu einem QR-Code-Bild, das auf großen Screens angezeigt wird.
          </p>
        </div>
      </div>

      {/* Prompt Settings */}
      <div className="admin-card p-6 space-y-4">
        <h4 className="font-semibold text-slate-900 flex items-center gap-2">
          <ToggleRight className="w-4 h-4 text-emerald-500" />
          Review-Prompt Einstellungen
        </h4>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-slate-700">Review-Prompt aktiviert</span>
            <p className="text-xs text-slate-400">Zeigt Nutzern dezent eine Bewertungsaufforderung</p>
          </div>
          <button
            onClick={() => setSettings({ ...settings, enable_review_prompt: !settings.enable_review_prompt })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.enable_review_prompt ? 'bg-blue-500' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.enable_review_prompt ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Min. Tage seit Registrierung
            </label>
            <input
              type="number"
              min={1}
              value={settings.min_days_since_signup}
              onChange={(e) => setSettings({ ...settings, min_days_since_signup: parseInt(e.target.value) || 7 })}
              className="admin-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Min. Videos abgeschlossen
            </label>
            <input
              type="number"
              min={0}
              value={settings.min_videos_completed}
              onChange={(e) => setSettings({ ...settings, min_videos_completed: parseInt(e.target.value) || 10 })}
              className="admin-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Cooldown (Tage)
            </label>
            <input
              type="number"
              min={1}
              value={settings.cooldown_days}
              onChange={(e) => setSettings({ ...settings, cooldown_days: parseInt(e.target.value) || 60 })}
              className="admin-input w-full"
            />
            <p className="text-xs text-slate-400 mt-1">Nicht erneut fragen innerhalb dieser Zeit</p>
          </div>
        </div>
      </div>

      {/* Compliance Note */}
      <div className="admin-card p-4 bg-amber-50 border-amber-200">
        <p className="text-sm text-amber-800">
          <strong>Google Policy Compliance:</strong> Keine Incentives, keine Stern-Vorgaben, 
          kein Filtern negativer Bewertungen. Der Prompt ist neutral formuliert und kann jederzeit abgelehnt werden.
        </p>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 transition-all"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Speichern
        </button>
      </div>
    </div>
  );
}
