import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RequireAuth } from '@/components/home/RequireAuth';
import { Button } from '@/components/ui/button';
import { SnowtoneGame } from '@/components/game/SnowtoneGame';
import { useLanguage } from '@/hooks/useLanguage';
import { gamesCopy } from '@/i18n/games';

export default function Snowtone() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  return <RequireAuth><div className="ts-light-module fixed inset-0 flex h-[100dvh] flex-col bg-ts-surface">
    <header className="flex shrink-0 items-center justify-between bg-ts-card px-3 pb-2 pt-[calc(env(safe-area-inset-top)+8px)] text-ts-ink">
      <Button variant="ghost" onClick={() => navigate('/games')}><ChevronLeft />{gamesCopy[language].back}</Button>
      <span className="pr-3 text-lg font-bold">Snowtone</span>
    </header>
    <main className="min-h-0 flex-1 pb-[env(safe-area-inset-bottom)]"><SnowtoneGame /></main>
  </div></RequireAuth>;
}