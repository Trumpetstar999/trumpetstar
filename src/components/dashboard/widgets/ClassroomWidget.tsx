import { useMembership } from '@/hooks/useMembership';
import { Button } from '@/components/ui/button';
import { Users, Lock, Video, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UpgradeDialog } from '@/components/premium/UpgradeDialog';
import { useState } from 'react';

export function ClassroomWidget() {
  const { canAccessFeature } = useMembership();
  const navigate = useNavigate();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  
  const hasPremium = canAccessFeature('PREMIUM');

  if (!hasPremium) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
          <Lock className="w-7 h-7 text-white/30" />
        </div>
        
        <h3 className="text-white font-semibold mb-2">Klassenzimmer</h3>
        <p className="text-white/50 text-sm mb-4">
          Live-Unterricht ist Teil von Premium
        </p>
        
        <Button
          onClick={() => setUpgradeOpen(true)}
          className="w-full bg-accent-red hover:bg-accent-red/90 text-white"
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
        <Users className="w-5 h-5 text-brand-blue-start" />
        <h3 className="text-white font-semibold">Klassenzimmer</h3>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <Video className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="text-white text-sm font-medium">Jetzt verfügbar</p>
            <p className="text-white/50 text-xs">Starte eine Live-Session</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-brand-blue-start/20 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-brand-blue-start" />
          </div>
          <div>
            <p className="text-white text-sm font-medium">Nächster Termin</p>
            <p className="text-white/50 text-xs">Keiner geplant</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => navigate('/classroom')}
          className="flex-1 bg-brand-blue-mid hover:bg-brand-blue-start text-white"
        >
          Beitreten
        </Button>
        <Button
          onClick={() => navigate('/classroom')}
          variant="ghost"
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          <Calendar className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
