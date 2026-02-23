import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Nicht autorisiert' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Ungültiger Token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    let email = body.email?.toString().trim().toLowerCase() || '';

    if (!email) {
      return new Response(JSON.stringify({ error: 'E-Mail ist erforderlich' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'Ungültige E-Mail-Adresse' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Can't invite yourself
    if (email === user.email?.toLowerCase()) {
      return new Response(JSON.stringify({ error: 'Du kannst dich nicht selbst einladen' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if already invited by this user
    const { data: existing } = await supabase
      .from('referral_invitations')
      .select('id')
      .eq('inviter_user_id', user.id)
      .eq('invited_email', email)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: 'Du hast diese Person bereits eingeladen' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get inviter's display name
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle();

    const inviterName = profile?.display_name || user.email?.split('@')[0] || 'Ein Freund';

    // Send invitation email via Resend
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'E-Mail-Service nicht konfiguriert' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const appUrl = 'https://trumpetstar.lovable.app';

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 20px;">
        <h1 style="color: #1e40af; font-size: 22px; margin-bottom: 16px;">🎺 ${inviterName} hat dich zu Trumpetstar eingeladen!</h1>
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          Lerne Trompete spielen mit interaktiven Video-Lektionen, einem KI-Assistenten und vielem mehr.
        </p>
        <a href="${appUrl}/auth" style="display: inline-block; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
          Jetzt kostenlos starten
        </a>
        <p style="color: #6b7280; font-size: 13px; margin-top: 32px; line-height: 1.5;">
          Trumpetstar – Die Lernplattform für Trompete.
        </p>
      </div>
    `;

    // Build from address - ensure proper format
    const resendFromRaw = Deno.env.get('RESEND_FROM_EMAIL') || '';
    let fromAddress: string;
    if (resendFromRaw && resendFromRaw.includes('@')) {
      // If it already has "Name <email>" format, use as-is; otherwise wrap it
      fromAddress = resendFromRaw.includes('<') ? resendFromRaw : `Trumpetstar <${resendFromRaw}>`;
    } else {
      fromAddress = 'Trumpetstar <onboarding@resend.dev>';
    }

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [email],
        subject: `${inviterName} hat dich zu Trumpetstar eingeladen! 🎺`,
        html: htmlBody,
      }),
    });

    const resendData = await resendRes.json();
    if (!resendRes.ok) {
      console.error('Resend error:', resendData);
      return new Response(JSON.stringify({ error: 'E-Mail konnte nicht gesendet werden' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Record the invitation
    await supabase.from('referral_invitations').insert({
      inviter_user_id: user.id,
      invited_email: email,
      stars_awarded: true,
    });

    // Award 5 stars (5 entries in video_completions with video_id: null)
    const starInserts = Array.from({ length: 5 }, () => ({
      user_id: user.id,
      video_id: null,
      playback_speed: 100,
    }));
    await supabase.from('video_completions').insert(starInserts);

    console.log(`[invite-friend] ${user.id} invited ${email}, 5 stars awarded`);

    return new Response(JSON.stringify({ success: true, message: 'Einladung gesendet! Du hast 5 Sterne erhalten.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('invite-friend error:', error);
    return new Response(JSON.stringify({ error: 'Interner Fehler' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
