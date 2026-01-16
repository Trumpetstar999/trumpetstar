import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

type AppRole = 'admin' | 'moderator' | 'user';
type PlanKey = 'FREE' | 'BASIC' | 'PREMIUM';

interface CreateUserPayload {
  email: string;
  password: string;
  displayName: string;
  role?: AppRole | null;
  planKey?: PlanKey;
  isTeacher?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the caller is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Verify the caller's token and check if they're an admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: 'Invalid authorization token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if caller is admin
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    console.log(`Admin-users function called with action: ${action}`);

    // Action: Create new user
    if (action === 'create-user') {
      const body: CreateUserPayload = await req.json();
      const { email, password, displayName, role, planKey, isTeacher } = body;

      // Validate required fields
      if (!email || !password || !displayName) {
        return new Response(JSON.stringify({ 
          error: 'E-Mail, Passwort und Name sind erforderlich' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return new Response(JSON.stringify({ 
          error: 'Ungültige E-Mail-Adresse' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Validate password length
      if (password.length < 6) {
        return new Response(JSON.stringify({ 
          error: 'Passwort muss mindestens 6 Zeichen lang sein' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if user already exists
      const { data: existingUsers } = await supabaseClient.auth.admin.listUsers();
      const userExists = existingUsers?.users?.some(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (userExists) {
        return new Response(JSON.stringify({ 
          error: 'Ein Nutzer mit dieser E-Mail-Adresse existiert bereits' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create the user with Supabase Auth Admin API
      const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          display_name: displayName,
        },
      });

      if (createError || !newUser.user) {
        console.error('Error creating user:', createError);
        return new Response(JSON.stringify({ 
          error: createError?.message || 'Fehler beim Erstellen des Nutzers' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const userId = newUser.user.id;
      console.log(`Created new user: ${userId}`);

      // Update the profile with additional data (profile is auto-created by trigger)
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .update({ 
          display_name: displayName,
          is_teacher: isTeacher || false,
        })
        .eq('id', userId);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        // Don't fail the whole operation, profile will have default values
      }

      // Set user role if provided
      if (role) {
        const { error: roleError } = await supabaseClient
          .from('user_roles')
          .insert({ user_id: userId, role });

        if (roleError) {
          console.error('Error setting role:', roleError);
        }
      }

      // Set membership plan
      const effectivePlanKey = planKey || 'FREE';
      const planRanks: Record<PlanKey, number> = { FREE: 0, BASIC: 10, PREMIUM: 20 };
      const planNames: Record<PlanKey, string> = { FREE: 'Free', BASIC: 'Basic', PREMIUM: 'Premium' };

      const { error: membershipError } = await supabaseClient
        .from('user_memberships')
        .insert({
          user_id: userId,
          plan_key: effectivePlanKey,
          plan_rank: planRanks[effectivePlanKey],
          current_plan: planNames[effectivePlanKey],
        });

      if (membershipError) {
        console.error('Error setting membership:', membershipError);
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Nutzer erfolgreich erstellt',
        user: {
          id: userId,
          email,
          displayName,
          role: role || null,
          planKey: effectivePlanKey,
          isTeacher: isTeacher || false,
        },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Action: Delete user
    if (action === 'delete-user') {
      const body = await req.json();
      const { userId } = body;

      if (!userId) {
        return new Response(JSON.stringify({ error: 'User ID is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Prevent self-deletion
      if (userId === caller.id) {
        return new Response(JSON.stringify({ 
          error: 'Sie können sich nicht selbst löschen' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Delete user from Auth (cascades to other tables via FK)
      const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(userId);

      if (deleteError) {
        console.error('Error deleting user:', deleteError);
        return new Response(JSON.stringify({ 
          error: deleteError.message || 'Fehler beim Löschen des Nutzers' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Nutzer erfolgreich gelöscht',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Action: Reset password
    if (action === 'reset-password') {
      const body = await req.json();
      const { userId, newPassword } = body;

      if (!userId || !newPassword) {
        return new Response(JSON.stringify({ 
          error: 'User ID und neues Passwort sind erforderlich' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (newPassword.length < 6) {
        return new Response(JSON.stringify({ 
          error: 'Passwort muss mindestens 6 Zeichen lang sein' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error: updateError } = await supabaseClient.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

      if (updateError) {
        console.error('Error resetting password:', updateError);
        return new Response(JSON.stringify({ 
          error: updateError.message || 'Fehler beim Zurücksetzen des Passworts' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Passwort erfolgreich zurückgesetzt',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      error: 'Invalid action. Use: create-user, delete-user, reset-password' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Admin-users function error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
