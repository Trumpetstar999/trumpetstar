import nodemailer from 'nodemailer';

const TEST_RECIPIENT = 'schulterm@me.com';
const FIRST_NAME = 'Mario';

const transporter = nodemailer.createTransport({
  host: 'smtp.world4you.com',
  port: 587,
  secure: false,
  auth: {
    user: 'Valentin@trumpetstar.com',
    pass: process.env.SMTP_PASSWORD,
  },
  tls: { rejectUnauthorized: false }
});

function fill(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || `[${key}]`);
}

const BASE_URL = 'https://trumpetstar.com';
const vars = { first_name: FIRST_NAME, instrument: 'Trompete' };

const emails = [
  {
    tag: 'Tag 0 – Willkommen',
    subject: `Willkommen ${FIRST_NAME} – hier ist dein erster Schritt`,
    html: fill(`
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#fff;">
        <div style="text-align:center;margin-bottom:24px;">
          <span style="font-size:32px">🎺</span>
          <h2 style="color:#7c3aed;margin:8px 0;">TrumpetStar</h2>
        </div>
        <h1 style="color:#1a1a2e;font-size:24px;">Hallo {{first_name}},</h1>
        <p style="color:#333;line-height:1.6;">schön, dass du da bist!</p>
        <p style="color:#333;line-height:1.6;">Du hast dich für <strong>{{instrument}}</strong> entschieden – das ist eine großartige Wahl.</p>
        <p style="color:#333;line-height:1.6;">Ich weiß: Als Erwachsener hast du wenig Zeit. Deshalb ist unsere Methode auf <strong>5-Minuten-Einheiten</strong> ausgelegt – machbar, jeden Tag.</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${BASE_URL}/erste-schritte" style="display:inline-block;padding:16px 36px;background:#7c3aed;color:white;text-decoration:none;border-radius:8px;font-size:16px;font-weight:bold;">👉 Ersten Schritt ansehen</a>
        </div>
        <p style="color:#333;line-height:1.6;">PS: Die häufigste Frage: „Bin ich zu alt?"<br><strong>Antwort: Absolut nicht.</strong></p>
        <hr style="border:none;border-top:1px solid #eee;margin:32px 0;">
        <p style="color:#999;font-size:12px;text-align:center;">TrumpetStar · valentin@trumpetstar.com · <a href="${BASE_URL}/abmelden" style="color:#999;">Abmelden</a></p>
      </div>
    `, vars),
  },
  {
    tag: 'Tag 1 – Mini-Erfolg',
    subject: '2 Minuten Übung – mach das jetzt',
    html: fill(`
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#fff;">
        <div style="text-align:center;margin-bottom:24px;">
          <span style="font-size:32px">🎺</span>
          <h2 style="color:#7c3aed;margin:8px 0;">TrumpetStar</h2>
        </div>
        <h2 style="color:#1a1a2e;">Hey {{first_name}}, kurze Übung für heute</h2>
        <div style="background:#f3f0ff;border-left:4px solid #7c3aed;padding:16px 20px;border-radius:0 8px 8px 0;margin:24px 0;">
          <strong>🎯 Übung: Das erste Buzzing</strong><br>
          Ohne Instrument. Nur die Lippen. 2 Minuten.
        </div>
        <p style="color:#333;line-height:1.6;">Presse deine Lippen leicht zusammen und blas Luft durch – es sollte vibrieren. Das ist die Basis von allem.</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${BASE_URL}/videos/buzzing" style="display:inline-block;padding:16px 36px;background:#7c3aed;color:white;text-decoration:none;border-radius:8px;font-size:16px;font-weight:bold;">🎬 Video-Anleitung ansehen</a>
        </div>
        <p style="color:#333;">Und dann antworte mir einfach: <strong>„Fertig."</strong> 💪</p>
        <hr style="border:none;border-top:1px solid #eee;margin:32px 0;">
        <p style="color:#999;font-size:12px;text-align:center;">TrumpetStar · valentin@trumpetstar.com · <a href="${BASE_URL}/abmelden" style="color:#999;">Abmelden</a></p>
      </div>
    `, vars),
  },
  {
    tag: 'Tag 3 – Social Proof',
    subject: '„Ich dachte, mit 45 ist es zu spät" – Peter',
    html: fill(`
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#fff;">
        <div style="text-align:center;margin-bottom:24px;">
          <span style="font-size:32px">🎺</span>
          <h2 style="color:#7c3aed;margin:8px 0;">TrumpetStar</h2>
        </div>
        <h2 style="color:#1a1a2e;">Hey {{first_name}}, ich möchte dir jemanden vorstellen</h2>
        <div style="background:#f9f9f9;border-radius:12px;padding:24px;margin:24px 0;">
          <p style="font-size:48px;text-align:center;margin:0 0 16px;">👤</p>
          <p style="color:#555;font-size:15px;line-height:1.7;font-style:italic;">„Ich dachte, mit 45 ist es zu spät. Alle haben mir abgeraten. Aber nach 3 Monaten TrumpetStar habe ich meine ersten Songs gespielt. Die 5-Minuten-Methode passt perfekt in meinen Arbeitstag."</p>
          <p style="color:#7c3aed;font-weight:bold;margin:8px 0 0;">— Peter, 46, Ingenieur aus München</p>
        </div>
        <p style="color:#333;line-height:1.6;">Die häufigste Hürde: <em>„Meine Lippen werden so schnell müde."</em><br>Das ist absolut normal! Übe 5 Minuten, dann pausiere. Deine Lippen brauchen Training wie jeder andere Muskel.</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${BASE_URL}/erfahrungen" style="display:inline-block;padding:16px 36px;background:#7c3aed;color:white;text-decoration:none;border-radius:8px;font-size:16px;font-weight:bold;">📖 Mehr Erfahrungsberichte</a>
        </div>
        <hr style="border:none;border-top:1px solid #eee;margin:32px 0;">
        <p style="color:#999;font-size:12px;text-align:center;">TrumpetStar · valentin@trumpetstar.com · <a href="${BASE_URL}/abmelden" style="color:#999;">Abmelden</a></p>
      </div>
    `, vars),
  },
  {
    tag: 'Tag 5 – Soft Offer',
    subject: 'Das hat mir am Anfang gefehlt',
    html: fill(`
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#fff;">
        <div style="text-align:center;margin-bottom:24px;">
          <span style="font-size:32px">🎺</span>
          <h2 style="color:#7c3aed;margin:8px 0;">TrumpetStar</h2>
        </div>
        <h2 style="color:#1a1a2e;">Hey {{first_name}} – kleines Geständnis</h2>
        <p style="color:#333;line-height:1.6;">Als ich als professioneller Trompeter begonnen habe, gab es keine strukturierte Methode für Einsteiger. Man hat sich irgendwie durchgebissen.</p>
        <p style="color:#333;line-height:1.6;">Heute gibt es <strong>TrumpetStar</strong> – das System, das ich mir damals gewünscht hätte:</p>
        <ul style="color:#333;line-height:2;">
          <li>✅ Schritt-für-Schritt Anleitungen (auch ohne Vorkenntnisse)</li>
          <li>✅ Video-Tutorials von Profi-Trompetern</li>
          <li>✅ App mit Fortschritts-Tracking & Gamification</li>
          <li>✅ Community mit anderen Lernenden</li>
        </ul>
        <div style="text-align:center;margin:32px 0;">
          <a href="${BASE_URL}/kurse/pro" style="display:inline-block;padding:16px 36px;background:#7c3aed;color:white;text-decoration:none;border-radius:8px;font-size:16px;font-weight:bold;">🎓 Pro-Kurs entdecken</a>
        </div>
        <p style="color:#999;font-size:14px;">PS: 30-Tage-Geld-zurück-Garantie. Ohne Fragen, ohne Formulare.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:32px 0;">
        <p style="color:#999;font-size:12px;text-align:center;">TrumpetStar · valentin@trumpetstar.com · <a href="${BASE_URL}/abmelden" style="color:#999;">Abmelden</a></p>
      </div>
    `, vars),
  },
  {
    tag: 'Tag 7 – Deadline',
    subject: '⏰ Letzte Chance: Bonus-Lektionen (heute Abend)',
    html: fill(`
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#fff;">
        <div style="text-align:center;margin-bottom:24px;">
          <span style="font-size:32px">🎺</span>
          <h2 style="color:#7c3aed;margin:8px 0;">TrumpetStar</h2>
        </div>
        <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:16px;text-align:center;margin-bottom:24px;">
          ⏰ <strong>Heute ist der letzte Tag für den Bonus</strong>
        </div>
        <h2 style="color:#1a1a2e;">Hey {{first_name}}</h2>
        <p style="color:#333;line-height:1.6;">In den letzten 7 Tagen hast du die Grundlagen kennengelernt. Du weißt jetzt, was möglich ist.</p>
        <p style="color:#333;line-height:1.6;">Heute – und nur heute – gibt es den Pro-Kurs mit diesen Bonus-Inhalten:</p>
        <div style="background:#f3f0ff;border-radius:12px;padding:20px;margin:20px 0;">
          <p style="margin:8px 0;">🎁 <strong>„Erste 30 Tage" detaillierter Übeplan</strong></p>
          <p style="margin:8px 0;">🎁 <strong>Exklusives Live-Q&A mit Mario</strong></p>
          <p style="margin:8px 0;">🎁 <strong>Übeplan-Template (PDF, druckbar)</strong></p>
        </div>
        <div style="text-align:center;margin:32px 0;">
          <a href="${BASE_URL}/kurse/pro?bonus=true" style="display:inline-block;padding:18px 40px;background:#e53e3e;color:white;text-decoration:none;border-radius:8px;font-size:18px;font-weight:bold;">🔥 Bonus jetzt sichern</a>
        </div>
        <p style="color:#999;font-size:14px;text-align:center;">Nach heute sind die Bonus-Lektionen nicht mehr verfügbar.<br>30-Tage-Geld-zurück-Garantie.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:32px 0;">
        <p style="color:#999;font-size:12px;text-align:center;">TrumpetStar · valentin@trumpetstar.com · <a href="${BASE_URL}/abmelden" style="color:#999;">Abmelden</a></p>
      </div>
    `, vars),
  }
];

async function run() {
  console.log('🎺 Valentin Mail-Test – sende 5 Testmails...\n');

  for (const [i, email] of emails.entries()) {
    try {
      const info = await transporter.sendMail({
        from: '"Valentin | TrumpetStar" <Valentin@trumpetstar.com>',
        to: TEST_RECIPIENT,
        subject: `[TEST] ${email.subject}`,
        html: email.html,
      });
      console.log(`✅ ${email.tag} → ${info.messageId}`);
    } catch (err) {
      console.error(`❌ ${email.tag} → FEHLER: ${err.message}`);
    }

    // 1s Pause zwischen Mails
    if (i < emails.length - 1) await new Promise(r => setTimeout(r, 1000));
  }

  console.log('\n✅ Fertig. Bitte Posteingang von schulterm@me.com prüfen.');
}

run();
