import { useState, useEffect, createContext, useContext, ReactNode, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  logActivity: (action: string, metadata?: Record<string, unknown>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const lastLoginLoggedRef = useRef<string | null>(null);

  // Function to log user activity
  async function logActivity(action: string, metadata: Record<string, unknown> = {}) {
    if (!user) return;
    
    try {
      await supabase.from('activity_logs').insert([{
        user_id: user.id,
        action,
        metadata: metadata as Json,
      }]);
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Log login activity and award daily login star (prevent duplicate logs for same session)
        if (event === 'SIGNED_IN' && session?.user) {
          const sessionKey = `${session.user.id}-${session.access_token?.slice(-10)}`;
          if (lastLoginLoggedRef.current !== sessionKey) {
            lastLoginLoggedRef.current = sessionKey;
            setTimeout(async () => {
              try {
                // Log login activity
                await supabase.from('activity_logs').insert([{
                  user_id: session.user.id,
                  action: 'login',
                  metadata: { event } as Json,
                }]);
                
                // Check if user already got a login star today
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todayIso = today.toISOString();
                
                const { data: existingLoginStar } = await supabase
                  .from('video_completions')
                  .select('id')
                  .eq('user_id', session.user.id)
                  .is('video_id', null)
                  .gte('completed_at', todayIso)
                  .limit(1);
                
                // Award daily login star if not already awarded today
                if (!existingLoginStar || existingLoginStar.length === 0) {
                  await supabase.from('video_completions').insert([{
                    user_id: session.user.id,
                    video_id: null,
                    playback_speed: 100,
                  }]);
                  console.log('[Auth] Daily login star awarded');
                }
              } catch (error) {
                console.error('Error logging login:', error);
              }
            }, 100);
          }
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    lastLoginLoggedRef.current = null;
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, logActivity }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
