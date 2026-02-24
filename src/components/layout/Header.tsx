import { useState, useEffect } from 'react';
import { Star, WifiOff, LogOut, User, Settings, HelpCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useTabNavigation } from '@/hooks/useTabNavigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import trumpetstarLogo from '@/assets/trumpetstar-logo.png';
import { MembershipStatusBadge } from '@/components/levels/MembershipStatusBadge';
import { TunerButton } from '@/components/tuner/TunerButton';
import { DailyPassIndicator } from '@/components/premium/DailyPassIndicator';
import { supabase } from '@/integrations/supabase/client';

interface HeaderProps {
  title: string;
  stars: number;
  isOffline?: boolean;
  videoCount?: number;
}

interface Profile {
  avatar_url: string | null;
  display_name: string | null;
}

export function Header({ title, stars, isOffline = false, videoCount }: HeaderProps) {
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const { navigateToTab } = useTabNavigation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('avatar_url, display_name')
          .eq('id', user.id)
          .single();
        if (data) setProfile(data);
      };
      fetchProfile();
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
  };

  const userInitials = profile?.display_name?.slice(0, 2).toUpperCase() || 
    user?.email?.slice(0, 2).toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-40 glass safe-top">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left: Logo */}
        <div className="flex items-center gap-4">
          <a 
            href="https://trumpetstar.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-shrink-0 hover:opacity-90 transition-opacity"
          >
            <img 
              src={trumpetstarLogo} 
              alt="Trumpetstar" 
              className="h-10 w-auto"
            />
          </a>
        </div>
        
        {/* Center: Title + Video Count */}
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white">{title}</h1>
          {videoCount !== undefined && (
            <span className="text-sm text-white/75">
              {videoCount} Videos
            </span>
          )}
        </div>
        
        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Daily Pass Indicator for Free users */}
          <DailyPassIndicator />
          
          {/* Tuner Button */}
          <TunerButton />
          
          {/* Membership Badge */}
          <MembershipStatusBadge />
          
          {isOffline && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-sm">
              <WifiOff className="w-4 h-4" />
              <span>Offline</span>
            </div>
          )}
          
          {/* Stars display - clickable to profile */}
          <button 
            onClick={() => navigateToTab('profile')}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-reward-gold/20 border border-reward-gold/40 hover:bg-reward-gold/30 transition-colors cursor-pointer"
          >
            <Star className="w-5 h-5 text-reward-gold fill-reward-gold" />
            <span className="font-semibold text-white">{stars}</span>
          </button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                <Avatar className="w-9 h-9">
                  <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || 'Profil'} />
                  <AvatarFallback className="bg-white/20 text-white">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white">
              <DropdownMenuItem disabled className="text-gray-500">
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
              <DropdownMenuItem onClick={() => navigate('/hilfe')}>
                <HelpCircle className="w-4 h-4 mr-2" />
                Hilfe-Center
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-accent-red">
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
