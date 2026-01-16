import { useMembership } from '@/hooks/useMembership';
import { useTabNavigation } from '@/hooks/useTabNavigation';
import { Button } from '@/components/ui/button';
import { Users, Lock, Video, Calendar } from 'lucide-react';
import { UpgradeDialog } from '@/components/premium/UpgradeDialog';
import { useState } from 'react';

export function ClassroomWidget() {
  const { canAccessFeature } = useMembership();
  const { navigateToTab } = useTabNavigation();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  
  const hasPremium = canAccessFeature('PREMIUM');

  if (!hasPremium) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
          <Lock className="w-7 h-7 text-white/50" />
        </div>
        
        <h3 className="text-white font-semibold mb-2">Klassenzimmer</h3>
        <p className="text-white/70 text-sm mb-4">
          Live-Unterricht ist Teil von Premium
        </p>
        
        <Button
          onClick={() => setUpgradeOpen(true)}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-medium"
        >
          Premium freischalten
        </Button>

        <UpgradeDialog
          open={upgradeOpen}
          onOpenChange={setUpgradeOpen}
          requiredPlanKey="PREMIUM"
          title="Live-Unterricht & gemeinsames Musizieren"
          description="Im Klassenzimmer triffst du deinen Lehrer und andere Musiker live. Ihr könnt gemeinsam spielen, Fragen klären und gezielt an deinem Fortschritt arbeiten. Diese Funktion ist Teil von Premium."
        />
      </div>
    );
  }

  // Premium user - show actual content
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-blue-400" />
        <h3 className="text-white font-semibold">Klassenzimmer</h3>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-3 p-3 bg-white/10 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <Video className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-white text-sm font-medium">Jetzt verfügbar</p>
            <p className="text-white/70 text-xs">Starte eine Live-Session</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-white/10 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-white text-sm font-medium">Nächster Termin</p>
            <p className="text-white/70 text-xs">Keiner geplant</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => navigateToTab('classroom')}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium"
        >
          Beitreten
        </Button>
        <Button
          onClick={() => navigateToTab('classroom')}
          variant="ghost"
          className="text-white hover:text-white hover:bg-white/20 bg-white/10"
        >
          <Calendar className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
