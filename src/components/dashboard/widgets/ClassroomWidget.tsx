import { useMembership } from '@/hooks/useMembership';
import { useTabNavigation } from '@/hooks/useTabNavigation';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Users, Lock, Video, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ClassroomWidget() {
  const { canAccessFeature } = useMembership();
  const { navigateToTab } = useTabNavigation();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const hasPremium = canAccessFeature('PRO');

  if (!hasPremium) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
          <Lock className="w-7 h-7 text-white/50" />
        </div>
        
        <h3 className="text-white font-semibold mb-2">{t('widgets.classroom')}</h3>
        <p className="text-white/70 text-sm mb-4">
          {t('widgets.classroomProOnly')}
        </p>
        
        <Button
          onClick={() => navigate('/pricing')}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-medium"
        >
          {t('widgets.unlockPro')}
        </Button>
      </div>
    );
  }

  // Premium user - show actual content
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-blue-400" />
        <h3 className="text-white font-semibold">{t('widgets.classroom')}</h3>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-3 p-3 bg-white/10 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <Video className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-white text-sm font-medium">{t('widgets.nowAvailable')}</p>
            <p className="text-white/70 text-xs">{t('widgets.startLiveSession')}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-white/10 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-white text-sm font-medium">{t('widgets.nextAppointment')}</p>
            <p className="text-white/70 text-xs">{t('widgets.nonePlanned')}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => navigateToTab('classroom')}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium"
        >
          {t('widgets.join')}
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
