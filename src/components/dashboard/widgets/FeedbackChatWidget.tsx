import { useMembership } from '@/hooks/useMembership';
import { Button } from '@/components/ui/button';
import { MessageSquare, Lock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UpgradeDialog } from '@/components/premium/UpgradeDialog';
import { useState } from 'react';

export function FeedbackChatWidget() {
  const { canAccessFeature, planKey } = useMembership();
  const navigate = useNavigate();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  
  const hasPremium = canAccessFeature('PREMIUM');

  if (!hasPremium) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
          <Lock className="w-7 h-7 text-white/30" />
        </div>
        
        <h3 className="text-white font-semibold mb-2">Feedback & Chat</h3>
        <p className="text-white/50 text-sm mb-4">
          Persönliches Feedback ist Teil von Premium
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
          title="Persönliches Feedback zu deinen Aufnahmen"
          description="Mit Premium kannst du deine Aufnahmen direkt an deinen Lehrer oder den Admin senden und gezieltes Feedback mit Zeitmarken und Antwort-Videos erhalten."
        />
      </div>
    );
  }

  // Premium user - show actual content
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-brand-blue-start" />
        <h3 className="text-white font-semibold">Feedback & Chat</h3>
      </div>

      <div className="p-4 bg-white/5 rounded-xl mb-4">
        <p className="text-white/50 text-sm mb-2">Letztes Feedback</p>
        <p className="text-white text-sm">
          Keine neuen Nachrichten
        </p>
      </div>

      <Button
        onClick={() => navigate('/chats')}
        variant="ghost"
        className="w-full text-white/80 hover:text-white hover:bg-white/10"
      >
        Chat öffnen
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}
