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

        // Log login activity (prevent duplicate logs for same session)
        if (event === 'SIGNED_IN' && session?.user) {
          const sessionKey = `${session.user.id}-${session.access_token?.slice(-10)}`;
          if (lastLoginLoggedRef.current !== sessionKey) {
            lastLoginLoggedRef.current = sessionKey;
            setTimeout(async () => {
              try {
                await supabase.from('activity_logs').insert([{
                  user_id: session.user.id,
                  action: 'login',
                  metadata: { event } as Json,
                }]);
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
