import { useFeatureFlags, FeatureFlag } from '@/hooks/useFeatureFlags';
import { Switch } from '@/components/ui/switch';
import { Loader2, Eye, EyeOff, Menu } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function FeatureFlagManager() {
  const { flags, loading, toggleFlag } = useFeatureFlags();

  const handleToggle = async (flag: FeatureFlag) => {
    const success = await toggleFlag(flag.id, !flag.is_enabled);
    if (success) {
      toast.success(
        flag.is_enabled 
          ? `"${flag.display_name}" wurde deaktiviert` 
          : `"${flag.display_name}" wurde aktiviert`
      );
    } else {
      toast.error('Fehler beim Speichern');
    }
  };

  if (loading) {
    return (
      <div className="admin-card p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  // Separate menu flags from other flags
  const menuFlags = flags.filter(f => f.key.startsWith('menu_'));
  const otherFlags = flags.filter(f => !f.key.startsWith('menu_'));

  return (
    <div className="space-y-6">
      {/* Menu Items Section */}
      <div className="admin-card">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Menu className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Menüpunkte</h3>
              <p className="text-sm text-slate-500">Ein-/Ausblenden von Bereichen in der App</p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {menuFlags.map((flag) => (
            <div
              key={flag.id}
              className={cn(
                'p-5 flex items-center justify-between gap-4 transition-colors',
                !flag.is_enabled && 'bg-slate-50'
              )}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
                  flag.is_enabled ? 'bg-emerald-100' : 'bg-slate-200'
                )}>
                  {flag.is_enabled ? (
                    <Eye className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'font-medium',
                      flag.is_enabled ? 'text-slate-900' : 'text-slate-500'
                    )}>
                      {flag.display_name}
                    </span>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium',
                      flag.is_enabled 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-slate-200 text-slate-500'
                    )}>
                      {flag.is_enabled ? 'Sichtbar' : 'Versteckt'}
                    </span>
                  </div>
                  {flag.description && (
                    <p className="text-sm text-slate-500 mt-0.5">{flag.description}</p>
                  )}
                </div>
              </div>
              
              <Switch
                checked={flag.is_enabled}
                onCheckedChange={() => handleToggle(flag)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Other Feature Flags (if any) */}
      {otherFlags.length > 0 && (
        <div className="admin-card">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Weitere Features</h3>
          </div>

          <div className="divide-y divide-slate-100">
            {otherFlags.map((flag) => (
              <div
                key={flag.id}
                className={cn(
                  'p-5 flex items-center justify-between gap-4 transition-colors',
                  !flag.is_enabled && 'bg-slate-50'
                )}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'font-medium',
                      flag.is_enabled ? 'text-slate-900' : 'text-slate-500'
                    )}>
                      {flag.display_name}
                    </span>
                  </div>
                  {flag.description && (
                    <p className="text-sm text-slate-500 mt-0.5">{flag.description}</p>
                  )}
                </div>
                
                <Switch
                  checked={flag.is_enabled}
                  onCheckedChange={() => handleToggle(flag)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="admin-card p-5 bg-amber-50 border-amber-200">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
            <span className="text-amber-600 text-lg">💡</span>
          </div>
          <div>
            <p className="text-sm font-medium text-amber-800">Hinweis</p>
            <p className="text-sm text-amber-700 mt-1">
              Änderungen werden sofort wirksam. Deaktivierte Menüpunkte werden für alle Nutzer ausgeblendet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
