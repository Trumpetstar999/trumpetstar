import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { safeNextPath } from '@/config/apps';
import { BottomSheet } from './BottomSheet';

interface LoginSheetProps {
  open: boolean;
  next: string | null;
  onClose: () => void;
}

export function LoginSheet({ open, next, onClose }: LoginSheetProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const go = (path: '/login' | '/signup') => {
    const target = safeNextPath(next);
    if (target) sessionStorage.setItem('returnTo', target);
    navigate(target ? `${path}?redirect=${encodeURIComponent(target)}` : path);
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={`🔒 ${t('home.lockT')}`}>
      <p className="text-ts-muted text-[15px] leading-snug mb-5">{t('home.lockP')}</p>
      <div className="flex flex-col gap-2.5">
        <button onClick={() => go('/login')} className="min-h-12 rounded-full bg-ts-gold text-ts-on font-bold text-base active:scale-[.98] transition">
          {t('home.login')}
        </button>
        <button onClick={() => go('/signup')} className="min-h-12 rounded-full border-2 border-ts-deep text-ts-deep font-bold text-base active:scale-[.98] transition">
          {t('home.reg')}
        </button>
        <button onClick={onClose} className="min-h-11 text-ts-muted font-semibold">
          {t('home.later')}
        </button>
      </div>
    </BottomSheet>
  );
}
