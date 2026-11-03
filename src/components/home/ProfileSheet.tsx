import { useNavigate } from 'react-router-dom';
import { ChevronRight, LogOut, Mic, User, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { PROFILE_ROUTE } from '@/config/apps';
import { BottomSheet } from './BottomSheet';

interface Props { open: boolean; onClose: () => void; name: string; stars: number }

export function ProfileSheet({ open, onClose, name, stars }: Props) {
  const { t, skillLevel } = useLanguage();
  const { signOut } = useAuth();
  const { isAdmin, isLoading } = useUserRole();
  const navigate = useNavigate();
  const go = () => { onClose(); navigate(PROFILE_ROUTE); };
  const row = 'flex items-center gap-3 w-full min-h-12 px-3 rounded-2xl text-left font-semibold active:bg-ts-surface';
  return (
    <BottomSheet open={open} onClose={onClose} title={name || t('home.profile')}>
      <div className="flex gap-2 mb-4">
        <span className="rounded-full bg-ts-surface px-3 py-1.5 text-sm font-bold"><span className="text-ts-gold">★</span> {stars} {t('home.stars')}</span>
        {skillLevel && (
          <span className="rounded-full bg-ts-surface px-3 py-1.5 text-sm font-bold">
            {t('home.levelLabel')}: {skillLevel === 'intermediate' ? t('home.lvlIntermediate') : t('home.lvlBeginner')}
          </span>
        )}
      </div>
      <button className={row} onClick={go}><Mic className="w-5 h-5 text-ts-deep" /><span className="flex-1">{t('home.myRec')}</span><ChevronRight className="w-4 h-4 text-ts-muted" /></button>
      <button className={row} onClick={go}><User className="w-5 h-5 text-ts-deep" /><span className="flex-1">{t('home.openProfile')}</span><ChevronRight className="w-4 h-4 text-ts-muted" /></button>
      {isAdmin && !isLoading && (
        <Button variant="ghost" className={`${row} justify-start whitespace-normal text-ts-deep hover:bg-ts-surface hover:text-ts-deep`} onClick={() => { onClose(); navigate('/app/admin'); }}>
          <Settings className="w-5 h-5" /><span className="flex-1">{t('home.adminArea')}</span><ChevronRight className="w-4 h-4 text-ts-muted" />
        </Button>
      )}
      <button className={`${row} text-ts-red`} onClick={async () => { onClose(); await signOut(); }}><LogOut className="w-5 h-5" /><span className="flex-1">{t('home.logout')}</span></button>
    </BottomSheet>
  );
}
