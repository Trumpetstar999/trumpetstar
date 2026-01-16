import { useState, useEffect } from 'react';
import { Search, RefreshCw, User, Calendar, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface UserMembership {
  id: string;
  email: string;
  display_name: string | null;
  plan_key: string;
  plan_rank: number;
  active_product_ids: string[];
  last_checked_at: string;
}

interface DebugResult {
  cache: {
    plan_key: string;
    plan_rank: number;
    active_product_ids: string[];
    last_checked_at: string;
  } | null;
  live: {
    planKey: string;
    planRank: number;
    activeProductIds: string[];
  } | null;
}

const PLAN_COLORS: Record<string, string> = {
  FREE: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  BASIC: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
  PREMIUM: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
};

export function MembershipDebugPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserMembership[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserMembership | null>(null);
  const [debugResult, setDebugResult] = useState<DebugResult | null>(null);
  const [isDebugging, setIsDebugging] = useState(false);

  async function searchUsers() {
    if (!searchQuery.trim()) {
      toast.error('Bitte gib einen Suchbegriff ein');
      return;
    }

    setIsLoading(true);
    try {
      // Search in profiles and join with membership cache
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          display_name,
          user_membership_cache (
            plan_key,
            plan_rank,
            active_product_ids,
            last_checked_at
          )
        `)
        .or(`display_name.ilike.%${searchQuery}%,id.eq.${searchQuery}`)
        .limit(20);

      if (error) throw error;

      // Get emails from auth.users via a different approach
      // Since we can't query auth.users directly, we'll use the profiles data
      const results: UserMembership[] = (data || []).map((profile: any) => ({
        id: profile.id,
        email: '', // We'll need to get this separately or show user ID
        display_name: profile.display_name,
        plan_key: profile.user_membership_cache?.[0]?.plan_key || 'FREE',
        plan_rank: profile.user_membership_cache?.[0]?.plan_rank || 0,
        active_product_ids: profile.user_membership_cache?.[0]?.active_product_ids || [],
        last_checked_at: profile.user_membership_cache?.[0]?.last_checked_at || '',
      }));

      setUsers(results);
      
      if (results.length === 0) {
        toast.info('Keine Benutzer gefunden');
      }
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Fehler bei der Suche');
    } finally {
      setIsLoading(false);
    }
  }

  async function debugUser(user: UserMembership) {
    setSelectedUser(user);
    setIsDebugging(true);
    setDebugResult(null);

    try {
      const { data: session } = await supabase.auth.getSession();
      
      // Get user's email from auth
      // For now, we'll try to debug by user ID
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/digimember?action=debug-membership`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
          }),
        }
      );

      if (!response.ok) throw new Error('Debug failed');
      
      const data = await response.json();
      setDebugResult(data);
    } catch (error) {
      console.error('Error debugging user:', error);
      toast.error('Debug fehlgeschlagen');
    } finally {
      setIsDebugging(false);
    }
  }

  async function refreshUserMembership(userId: string, email?: string) {
    if (!email) {
      toast.error('E-Mail-Adresse benötigt für Refresh');
      return;
    }

    try {
      const { data: session } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/digimember?action=check-membership`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            userId,
          }),
        }
      );

      if (!response.ok) throw new Error('Refresh failed');
      
      toast.success('Mitgliedschaft aktualisiert');
      
      // Refresh the debug view
      const user = users.find(u => u.id === userId);
      if (user) {
        await debugUser(user);
      }
    } catch (error) {
      console.error('Error refreshing membership:', error);
      toast.error('Aktualisierung fehlgeschlagen');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Membership Debug</CardTitle>
        <CardDescription>
          Benutzer suchen und deren Mitgliedschaftsstatus prüfen
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Name oder User-ID suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
              className="pl-10"
            />
          </div>
          <Button onClick={searchUsers} disabled={isLoading}>
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Suchen'}
          </Button>
        </div>

        {/* Results */}
        {users.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              {users.length} Benutzer gefunden
            </h4>
            <div className="space-y-2">
              {users.map(user => (
                <div
                  key={user.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedUser?.id === user.id 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => debugUser(user)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {user.display_name || 'Unbenannt'}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {user.id}
                        </p>
                      </div>
                    </div>
                    <Badge className={PLAN_COLORS[user.plan_key] || PLAN_COLORS.FREE}>
                      {user.plan_key}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Debug Panel */}
        {selectedUser && (
          <div className="border-t pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">
                Debug: {selectedUser.display_name || selectedUser.id}
              </h4>
              <Button
                size="sm"
                variant="outline"
                onClick={() => debugUser(selectedUser)}
                disabled={isDebugging}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isDebugging ? 'animate-spin' : ''}`} />
                Aktualisieren
              </Button>
            </div>

            {isDebugging ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : debugResult ? (
              <div className="grid gap-4 md:grid-cols-2">
                {/* Cache Data */}
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h5 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Cache-Daten
                  </h5>
                  {debugResult.cache ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Plan:</span>
                        <Badge className={PLAN_COLORS[debugResult.cache.plan_key] || PLAN_COLORS.FREE}>
                          {debugResult.cache.plan_key}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rank:</span>
                        <span>{debugResult.cache.plan_rank}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Produkte:</span>
                        <span>{debugResult.cache.active_product_ids?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Zuletzt:</span>
                        <span>
                          {debugResult.cache.last_checked_at 
                            ? formatDistanceToNow(new Date(debugResult.cache.last_checked_at), { 
                                addSuffix: true, 
                                locale: de 
                              })
                            : '-'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Kein Cache vorhanden</p>
                  )}
                </div>

                {/* Live Data */}
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h5 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Live-Daten (DigiMember)
                  </h5>
                  {debugResult.live ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Plan:</span>
                        <Badge className={PLAN_COLORS[debugResult.live.planKey] || PLAN_COLORS.FREE}>
                          {debugResult.live.planKey}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rank:</span>
                        <span>{debugResult.live.planRank}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Produkte:</span>
                        <span>{debugResult.live.activeProductIds?.length || 0}</span>
                      </div>
                      {debugResult.live.activeProductIds?.length > 0 && (
                        <div>
                          <span className="text-muted-foreground">IDs:</span>
                          <p className="font-mono text-xs mt-1">
                            {debugResult.live.activeProductIds.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Keine Live-Daten (E-Mail benötigt)
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
