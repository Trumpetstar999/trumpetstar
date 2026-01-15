import { Star, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title: string;
  stars: number;
  isOffline?: boolean;
}

export function Header({ title, stars, isOffline = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 glass border-b border-border safe-top">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {isOffline && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm">
              <WifiOff className="w-4 h-4" />
              <span>Offline</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20">
          <Star className="w-5 h-5 text-gold fill-gold" />
          <span className="font-semibold text-foreground">{stars}</span>
        </div>
      </div>
    </header>
  );
}
