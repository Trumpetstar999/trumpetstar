import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, CreditCard, HelpCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import trumpetstarLogo from '@/assets/trumpetstar-logo.png';

type MobileTab = 'home' | 'plan' | 'help' | 'profile';

const TAB_CONFIG: { id: MobileTab; icon: typeof Home; route: string }[] = [
  { id: 'home', icon: Home, route: '/mobile/home' },
  { id: 'plan', icon: CreditCard, route: '/mobile/plan' },
  { id: 'help', icon: HelpCircle, route: '/mobile/help' },
  { id: 'profile', icon: User, route: '/mobile/profile' },
];

const TAB_LABELS: Record<string, Record<MobileTab, string>> = {
  de: { home: 'Start', plan: 'Plan', help: 'Hilfe', profile: 'Profil' },
  en: { home: 'Home', plan: 'Plan', help: 'Help', profile: 'Profile' },
  es: { home: 'Inicio', plan: 'Plan', help: 'Ayuda', profile: 'Perfil' },
};

interface MobileLayoutProps {
  children: ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();

  const labels = TAB_LABELS[language] || TAB_LABELS.de;

  const activeTab = TAB_CONFIG.find(t => location.pathname.startsWith(t.route))?.id || 'home';

  return (
    <div className="flex flex-col min-h-[100dvh]">
      {/* Header */}
      <header className="flex items-center justify-center px-4 py-3 border-b border-white/10">
        <img src={trumpetstarLogo} alt="TrumpetStar" className="h-8 w-auto" />
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto pb-20">
        {children}
      </main>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/15"
        style={{
          background: 'linear-gradient(180deg, rgba(11,46,138,0.92) 0%, rgba(11,46,138,0.98) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="flex items-center justify-around py-2">
          {TAB_CONFIG.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.route)}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-4 py-1.5 rounded-xl transition-all min-h-[44px] min-w-[44px]',
                  isActive
                    ? 'text-white bg-white/15'
                    : 'text-white/50 hover:text-white/80'
                )}
              >
                <Icon className={cn('w-5 h-5', isActive && 'scale-110')} />
                <span className="text-[11px] font-medium">{labels[tab.id]}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
