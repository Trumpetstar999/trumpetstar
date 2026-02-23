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
      let { email, password, displayName, role, planKey, isTeacher } = body;

      // Clean and validate email
      email = email?.toString().trim().toLowerCase() || '';
      displayName = displayName?.toString().trim() || '';

      // Validate required fields
      if (!email || !password || !displayName) {
        return new Response(JSON.stringify({ 
          error: 'E-Mail, Passwort und Name sind erforderlich' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Stricter email validation - must match what Supabase Auth expects
      // Only allow valid characters: letters, numbers, dots, hyphens, underscores, plus
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        return new Response(JSON.stringify({ 
          error: 'Ungültige E-Mail-Adresse. Bitte prüfen Sie das Format.' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check for common email issues
      if (email.includes('..') || email.startsWith('.') || email.includes('.@') || email.includes('@.')) {
        return new Response(JSON.stringify({ 
          error: 'Ungültige E-Mail-Adresse. Bitte prüfen Sie das Format.' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`Creating user with email: ${email}`);

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

    // Action: Invite user (create + send magic link email)
    if (action === 'invite-user') {
      const body = await req.json();
      let { email } = body;

      email = email?.toString().trim().toLowerCase() || '';

      if (!email) {
        return new Response(JSON.stringify({ error: 'E-Mail ist erforderlich' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        return new Response(JSON.stringify({ error: 'Ungültige E-Mail-Adresse' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if user already exists
      const { data: existingUsers } = await supabaseClient.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email);

      if (existingUser) {
        return new Response(JSON.stringify({ 
          error: 'Ein Nutzer mit dieser E-Mail-Adresse existiert bereits' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Generate a random password (user will use magic link)
      const randomPassword = crypto.randomUUID().slice(0, 16) + 'Aa1!';

      // Create user with auto-confirmed email
      const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
        email,
        password: randomPassword,
        email_confirm: true,
      });

      if (createError || !newUser.user) {
        console.error('Error creating invited user:', createError);
        return new Response(JSON.stringify({ 
          error: createError?.message || 'Fehler beim Erstellen des Nutzers' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const userId = newUser.user.id;
      console.log(`Created invited user: ${userId}`);

      // Set default FREE membership
      await supabaseClient.from('user_memberships').insert({
        user_id: userId,
        plan_key: 'FREE',
        plan_rank: 0,
        current_plan: 'Free',
      });

      // Generate magic link for the invitation email
      const SUPABASE_URL_PUBLIC = Deno.env.get('SUPABASE_URL') || '';
      const siteUrl = SUPABASE_URL_PUBLIC.replace('.supabase.co', '').includes('osgrjouxwpnokfvzztji')
        ? 'https://trumpetstar.lovable.app'
        : SUPABASE_URL_PUBLIC;

      const { data: linkData, error: linkError } = await supabaseClient.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: {
          redirectTo: siteUrl,
        },
      });

      if (linkError || !linkData.properties?.action_link) {
        console.error('Error generating magic link:', linkError);
        // User is created but link failed - still return success
        return new Response(JSON.stringify({
          success: true,
          emailSent: false,
          message: 'Nutzer erstellt, aber Einladungs-E-Mail konnte nicht gesendet werden.',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const magicLink = linkData.properties.action_link;

      // Send invitation email via Resend
      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
      if (!RESEND_API_KEY) {
        return new Response(JSON.stringify({
          success: true,
          emailSent: false,
          message: 'Nutzer erstellt, aber RESEND_API_KEY fehlt.',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Try to load invitation template, fall back to hardcoded
      const { data: template } = await supabaseClient
        .from('email_templates')
        .select('*')
        .eq('template_key', 'invitation')
        .maybeSingle();

      let subject: string;
      let htmlBody: string;

      if (template) {
        subject = template.subject_de;
        htmlBody = (template.body_html_de as string).replace(/\{\{magic_link\}\}/g, magicLink);
      } else {
        subject = 'Du wurdest zu Trumpetstar eingeladen! 🎺';
        htmlBody = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 20px;">
            <h1 style="color: #1e40af; font-size: 22px; margin-bottom: 16px;">Willkommen bei Trumpetstar!</h1>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Du wurdest eingeladen, Trumpetstar zu nutzen – die Lernplattform für Trompete.
            </p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Klicke auf den Button, um dich einzuloggen und loszulegen:
            </p>
            <a href="${magicLink}" style="display: inline-block; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Jetzt einloggen
            </a>
            <p style="color: #6b7280; font-size: 13px; margin-top: 32px; line-height: 1.5;">
              Tipp: Für das beste Lernerlebnis empfehlen wir ein iPad oder Tablet im Querformat.
            </p>
          </div>
        `;
      }

      const resendFromRaw = Deno.env.get('RESEND_FROM_EMAIL') || '';
      const fromAddress = resendFromRaw.includes('<') ? resendFromRaw : (resendFromRaw.includes('@') ? `Trumpetstar <${resendFromRaw}>` : 'Trumpetstar <onboarding@resend.dev>');

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [email],
          subject,
          html: htmlBody,
        }),
      });

      const resendData = await resendRes.json();
      const emailSent = resendRes.ok;

      if (!emailSent) {
        console.error('Resend error for invitation:', resendData);
      }

      return new Response(JSON.stringify({
        success: true,
        emailSent,
        message: emailSent
          ? 'Einladung erfolgreich versendet'
          : 'Nutzer erstellt, aber E-Mail konnte nicht gesendet werden.',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      error: 'Invalid action. Use: create-user, delete-user, reset-password, invite-user' 
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
