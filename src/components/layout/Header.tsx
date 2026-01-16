import { Star, WifiOff, LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import trumpetstarLogo from '@/assets/trumpetstar-logo.png';

interface HeaderProps {
  title: string;
  stars: number;
  isOffline?: boolean;
}

export function Header({ title, stars, isOffline = false }: HeaderProps) {
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
  };

  const userInitials = user?.email?.slice(0, 2).toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-40 glass border-b border-border safe-top">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <a 
            href="https://trumpetstar.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-shrink-0"
          >
            <img 
              src={trumpetstarLogo} 
              alt="Trumpetstar" 
              className="h-10 w-auto"
            />
          </a>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {isOffline && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm">
              <WifiOff className="w-4 h-4" />
              <span>Offline</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {/* Stars display */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20">
            <Star className="w-5 h-5 text-gold fill-gold" />
            <span className="font-semibold text-foreground">{stars}</span>
          </div>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="w-9 h-9">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem disabled className="text-muted-foreground">
                <User className="w-4 h-4 mr-2" />
                {user?.email}
              </DropdownMenuItem>
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/admin')}>
                    <Settings className="w-4 h-4 mr-2" />
                    Admin
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Abmelden
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
