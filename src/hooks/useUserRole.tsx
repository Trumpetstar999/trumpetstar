import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useUserRole() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkRoles() {
      if (!user) {
        setIsAdmin(false);
        setIsTeacher(false);
        setIsLoading(false);
        return;
      }

      try {
        // Check admin role
        const { data: adminData, error: adminError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (adminError) {
          console.error('Error checking admin role:', adminError);
        } else {
          setIsAdmin(!!adminData);
        }

        // Check teacher status from profiles
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('is_teacher')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error checking teacher status:', profileError);
        } else {
          setIsTeacher(profileData?.is_teacher || false);
        }
      } catch (err) {
        console.error('Error checking roles:', err);
        setIsAdmin(false);
        setIsTeacher(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkRoles();
  }, [user]);

  return { isAdmin, isTeacher, isLoading };
}
