import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Save, Loader2, Eye, EyeOff, Copy, ExternalLink, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Setting {
  id: string;
  key: string;
  value: string | null;
  description: string | null;
}

export function Digistore24SettingsManager() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    const { data, error } = await supabase
      .from('digistore24_settings')
      .select('*')
      .order('key');

    if (error) {
      toast.error('Fehler beim Laden der Einstellungen');
      console.error(error);
    } else {
      setSettings(data || []);
      const values: Record<string, string> = {};
      data?.forEach(s => {
        values[s.key] = s.value || '';
      });
      setEditedValues(values);
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(editedValues)) {
        const { error } = await supabase
          .from('digistore24_settings')
          .update({ value })
          .eq('key', key);

        if (error) throw error;
      }
      toast.success('Einstellungen gespeichert');
      await loadSettings();
    } catch (error) {
      console.error(error);
      toast.error('Fehler beim Speichern');
    }
    setSaving(false);
  }

  function copyIpnUrl() {
    const baseUrl = editedValues['app_base_url'] || 'https://trumpetstar.lovable.app';
    const ipnUrl = `${baseUrl.replace(/\/$/, '')}/functions/v1/digistore24-ipn`;
    navigator.clipboard.writeText(ipnUrl);
    toast.success('IPN-URL kopiert!');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  const baseUrl = editedValues['app_base_url'] || 'https://trumpetstar.lovable.app';
  const ipnUrl = `https://osgrjouxwpnokfvzztji.supabase.co/functions/v1/digistore24-ipn`;

  return (
    <div className="space-y-6">
      {/* IPN URL Info Box */}
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="w-4 h-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <div className="space-y-2">
            <p className="font-medium">IPN-URL für Digistore24:</p>
            <div className="flex items-center gap-2 bg-white rounded-md p-2 font-mono text-sm">
              <code className="flex-1 break-all">{ipnUrl}</code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  navigator.clipboard.writeText(ipnUrl);
                  toast.success('IPN-URL kopiert!');
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm mt-2">
              Diese URL in Digistore24 unter <strong>Konto → Entwickler → IPN</strong> eintragen.
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Settings Form */}
      <div className="admin-card">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Allgemeine Einstellungen</h3>
          <p className="text-sm text-slate-500 mt-1">
            Konfiguration für die Digistore24-Integration
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* App Base URL */}
          <div className="space-y-2">
            <Label htmlFor="app_base_url">App Base URL</Label>
            <Input
              id="app_base_url"
              value={editedValues['app_base_url'] || ''}
              onChange={(e) => setEditedValues({ ...editedValues, app_base_url: e.target.value })}
              placeholder="https://trumpetstar.lovable.app"
            />
            <p className="text-xs text-slate-500">
              Basis-URL für Magic-Links in E-Mails (ohne trailing slash)
            </p>
          </div>

          {/* IPN Secret */}
          <div className="space-y-2">
            <Label htmlFor="ipn_secret">IPN Passphrase / Secret</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="ipn_secret"
                  type={showSecret ? 'text' : 'password'}
                  value={editedValues['ipn_secret'] || ''}
                  onChange={(e) => setEditedValues({ ...editedValues, ipn_secret: e.target.value })}
                  placeholder="Geheimes Passwort für IPN-Validierung"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowSecret(!showSecret)}
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              Muss mit dem IPN-Passwort in Digistore24 übereinstimmen
            </p>
          </div>

          {/* Support Email */}
          <div className="space-y-2">
            <Label htmlFor="support_email">Support E-Mail</Label>
            <Input
              id="support_email"
              type="email"
              value={editedValues['support_email'] || ''}
              onChange={(e) => setEditedValues({ ...editedValues, support_email: e.target.value })}
              placeholder="support@trumpetstar.com"
            />
          </div>

          {/* Default Locale */}
          <div className="space-y-2">
            <Label htmlFor="default_locale">Standard-Sprache</Label>
            <select
              id="default_locale"
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              value={editedValues['default_locale'] || 'de'}
              onChange={(e) => setEditedValues({ ...editedValues, default_locale: e.target.value })}
            >
              <option value="de">Deutsch (DE)</option>
              <option value="en">English (EN)</option>
              <option value="es">Español (ES)</option>
            </select>
            <p className="text-xs text-slate-500">
              Fallback wenn Sprache des Käufers nicht bekannt ist
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Einstellungen speichern
          </Button>
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="admin-card">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Einrichtung in Digistore24</h3>
        </div>
        <div className="p-6">
          <ol className="list-decimal list-inside space-y-3 text-sm text-slate-600">
            <li>
              Gehe zu{' '}
              <a
                href="https://www.digistore24.com/vendor/settings/api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                Digistore24 → Konto → Entwickler → IPN
                <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>Erstelle eine neue IPN-URL und trage die URL von oben ein</li>
            <li>Setze eine Passphrase und trage sie hier im Feld "IPN Passphrase" ein</li>
            <li>
              Aktiviere folgende Events:
              <ul className="list-disc list-inside ml-4 mt-1 text-slate-500">
                <li>on_payment (Kauf)</li>
                <li>on_rebill (Renewal)</li>
                <li>on_rebill_cancelled (Kündigung)</li>
                <li>on_refund (Erstattung)</li>
                <li>on_chargeback (Rückbuchung)</li>
              </ul>
            </li>
            <li>Speichere die Einstellungen in Digistore24</li>
            <li>Lege Produkt-Mappings im Tab "Produkte" an</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
