// Update email templates with www.trumpetstar.app URLs
const BASE = 'https://bfxwbiazhgtkjfdnkbwn.supabase.co';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmeHdiaWF6aGd0a2pmZG5rYnduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1ODgzMDIsImV4cCI6MjA4NzE2NDMwMn0.lwF2MbCPM4S78Iav0skQbjYmrxIX4XbCOjZ6iTIvP6U';

const h = {
  'apikey': ANON,
  'Authorization': `Bearer ${ANON}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal'
};

const DOMAIN = 'https://www.trumpetstar.app';

const TEMPLATES = [
  {
    id: 'e62bc24e-3bd4-48fa-8974-63da387adc7b',
    body_html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#fff;">
  <div style="text-align:center;margin-bottom:24px;"><span style="font-size:32px">🎺</span><h2 style="color:#7c3aed;margin:8px 0;">TrumpetStar</h2></div>
  <h1 style="color:#1a1a2e;font-size:24px;">Hallo {{first_name}},</h1>
  <p style="color:#333;line-height:1.6;">schön, dass du da bist!</p>
  <p style="color:#333;line-height:1.6;">Du hast dich für <strong>{{instrument}}</strong> entschieden – das ist eine großartige Wahl.</p>
  <p style="color:#333;line-height:1.6;">Unsere Methode ist auf <strong>5-Minuten-Einheiten</strong> ausgelegt.</p>
  <div style="text-align:center;margin:32px 0;">
    <a href="${DOMAIN}/erste-schritte" style="display:inline-block;padding:16px 32px;background:#7c3aed;color:white;text-decoration:none;border-radius:8px;font-weight:bold;">👉 Ersten Schritt ansehen</a>
  </div>
  <p style="color:#333;line-height:1.6;">PS: Die häufigste Frage: „Bin ich zu alt?"<br><strong>Antwort: Absolut nicht.</strong></p>
  <hr style="border:none;border-top:1px solid #eee;margin:32px 0;">
  <p style="color:#999;font-size:12px;text-align:center;">TrumpetStar · <a href="${DOMAIN}" style="color:#999;">www.trumpetstar.app</a></p>
  {{tracking_pixel}}
</div>`
  },
  {
    id: 'c478be31-933e-4ac8-acff-793f6ea323ab',
    body_html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#fff;">
  <div style="text-align:center;margin-bottom:24px;"><span style="font-size:32px">🎺</span><h2 style="color:#7c3aed;margin:8px 0;">TrumpetStar</h2></div>
  <h2 style="color:#1a1a2e;">Übung: Das erste Buzzing</h2>
  <div style="background:#f3f0ff;border-left:4px solid #7c3aed;padding:16px 20px;border-radius:0 8px 8px 0;margin:24px 0;">
    <strong>🎯 2 Minuten, ohne Instrument. Nur die Lippen.</strong>
  </div>
  <div style="text-align:center;margin:32px 0;">
    <a href="${DOMAIN}/videos/buzzing" style="display:inline-block;padding:16px 32px;background:#7c3aed;color:white;text-decoration:none;border-radius:8px;font-weight:bold;">🎬 Video-Anleitung</a>
  </div>
  <p style="color:#333;">Und dann antworte mir einfach: <strong>„Fertig."</strong> 💪</p>
  <hr style="border:none;border-top:1px solid #eee;margin:32px 0;">
  <p style="color:#999;font-size:12px;text-align:center;">TrumpetStar · <a href="${DOMAIN}" style="color:#999;">www.trumpetstar.app</a></p>
  {{tracking_pixel}}
</div>`
  },
  {
    id: 'c2cdaa5e-6462-4561-8a53-a86c6e9e6e86',
    body_html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#fff;">
  <div style="text-align:center;margin-bottom:24px;"><span style="font-size:32px">🎺</span><h2 style="color:#7c3aed;margin:8px 0;">TrumpetStar</h2></div>
  <p style="color:#333;line-height:1.6;">Ich möchte dir jemanden vorstellen:</p>
  <div style="background:#f9f9f9;border-radius:12px;padding:24px;margin:24px 0;">
    <p style="font-size:48px;text-align:center;margin:0;">👤</p>
    <p style="color:#555;font-size:15px;line-height:1.7;font-style:italic;text-align:center;">„Ich dachte, mit 45 ist es zu spät. Alle haben mir abgeraten. Aber nach 3 Monaten TrumpetStar habe ich meine ersten Songs gespielt."</p>
    <p style="color:#7c3aed;font-weight:bold;text-align:center;">— Peter, 46, Ingenieur</p>
  </div>
  <p style="color:#333;line-height:1.6;">Die häufigste Hürde: <em>„Meine Lippen werden so schnell müde."</em><br>Das ist absolut normal! Übe 5 Minuten, dann pausiere.</p>
  <div style="text-align:center;margin:32px 0;">
    <a href="${DOMAIN}/erfahrungen" style="display:inline-block;padding:16px 32px;background:#7c3aed;color:white;text-decoration:none;border-radius:8px;font-weight:bold;">📖 Mehr Erfahrungsberichte</a>
  </div>
  <hr style="border:none;border-top:1px solid #eee;margin:32px 0;">
  <p style="color:#999;font-size:12px;text-align:center;">TrumpetStar · <a href="${DOMAIN}" style="color:#999;">www.trumpetstar.app</a></p>
  {{tracking_pixel}}
</div>`
  },
  {
    id: '60c2b8c6-f0f4-46b8-97da-859ffa392a9e',
    body_html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#fff;">
  <div style="text-align:center;margin-bottom:24px;"><span style="font-size:32px">🎺</span><h2 style="color:#7c3aed;margin:8px 0;">TrumpetStar</h2></div>
  <p style="color:#333;line-height:1.6;">Als ich angefangen habe, gab es keine strukturierte Methode.</p>
  <p style="color:#333;line-height:1.6;">Heute gibt es <strong>Trumpetstar</strong> – das System, das ich mir damals gewünscht hätte:</p>
  <ul style="color:#333;line-height:2;">
    <li>✅ Schritt-für-Schritt Anleitungen</li>
    <li>✅ Video-Tutorials von Profis</li>
    <li>✅ App mit Fortschritts-Tracking</li>
  </ul>
  <div style="text-align:center;margin:32px 0;">
    <a href="${DOMAIN}/kurse/pro" style="display:inline-block;padding:16px 32px;background:#7c3aed;color:white;text-decoration:none;border-radius:8px;font-weight:bold;">🎓 Pro-Kurs entdecken</a>
  </div>
  <p style="color:#999;font-size:14px;">PS: 30-Tage-Geld-zurück-Garantie.</p>
  <hr style="border:none;border-top:1px solid #eee;margin:32px 0;">
  <p style="color:#999;font-size:12px;text-align:center;">TrumpetStar · <a href="${DOMAIN}" style="color:#999;">www.trumpetstar.app</a></p>
  {{tracking_pixel}}
</div>`
  },
  {
    id: '50643dad-9222-44b3-bd91-5dac6c77e5f7',
    body_html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#fff;">
  <div style="text-align:center;margin-bottom:24px;"><span style="font-size:32px">🎺</span><h2 style="color:#7c3aed;margin:8px 0;">TrumpetStar</h2></div>
  <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:16px;text-align:center;margin-bottom:24px;">
    ⏰ <strong>Heute ist der letzte Tag für den Bonus</strong>
  </div>
  <p style="color:#333;line-height:1.6;">In den letzten 7 Tagen hast du die Grundlagen kennengelernt.</p>
  <div style="background:#f3f0ff;border-radius:12px;padding:20px;margin:20px 0;">
    <p style="margin:8px 0;">🎁 <strong>„Erste 30 Tage" detaillierter Übeplan</strong></p>
    <p style="margin:8px 0;">🎁 <strong>Exklusives Live-Q&A</strong></p>
    <p style="margin:8px 0;">🎁 <strong>Übeplan-Template (PDF)</strong></p>
  </div>
  <div style="text-align:center;margin:32px 0;">
    <a href="${DOMAIN}/kurse/pro?bonus=true" style="display:inline-block;padding:18px 40px;background:#e53e3e;color:white;text-decoration:none;border-radius:8px;font-size:18px;font-weight:bold;">🔥 Bonus jetzt sichern</a>
  </div>
  <p style="color:#999;font-size:14px;text-align:center;">Nach heute nicht mehr verfügbar · 30-Tage-Geld-zurück-Garantie</p>
  <hr style="border:none;border-top:1px solid #eee;margin:32px 0;">
  <p style="color:#999;font-size:12px;text-align:center;">TrumpetStar · <a href="${DOMAIN}" style="color:#999;">www.trumpetstar.app</a></p>
  {{tracking_pixel}}
</div>`
  }
];

async function sb(method, path, body) {
  const res = await fetch(`${BASE}/rest/v1/${path}`, {
    method,
    headers: h,
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) console.error(`Error: ${res.status} ${await res.text()}`);
  return res.ok;
}

console.log('Updating email templates to www.trumpetstar.app...\n');

for (const t of TEMPLATES) {
  const ok = await sb('PATCH', `email_templates?id=eq.${t.id}`, { body_html: t.body_html });
  console.log(`${ok ? '✅' : '❌'} ${t.id.slice(0,8)}`);
}

console.log('\nDone.');
