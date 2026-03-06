'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
const fs = require('fs');

// ─── Knowledge Base laden ─────────────────────────────────────────────────────
const KB_FILE = path.join(__dirname, 'knowledge-base.json');
let KNOWLEDGE_BASE = {};

async function loadKnowledgeBase() {
  // Primär: aus Supabase laden (immer aktuell)
  try {
    const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/knowledge_base_settings?key=eq.main&select=value`, {
      headers: { 'apikey': process.env.SUPABASE_ANON_KEY, 'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}` }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data[0] && data[0].value) {
        KNOWLEDGE_BASE = data[0].value;
        console.log(`[KB] Wissensdatenbank aus Supabase geladen`);
        return;
      }
    }
  } catch (e) { /* fallback */ }
  // Fallback: lokale JSON-Datei
  try {
    KNOWLEDGE_BASE = JSON.parse(fs.readFileSync(KB_FILE, 'utf8'));
    console.log(`[KB] Wissensdatenbank aus lokalem File geladen`);
  } catch (e) {
    console.warn('[KB] Keine Wissensdatenbank gefunden – KI antwortet ohne Produktwissen');
  }
}

// ─── Config ───────────────────────────────────────────────────────────────────
const IMAP_HOST    = 'imap.world4you.com';
const IMAP_PORT    = 993;
const EMAIL        = 'valentin@trumpetstar.com';
const PASSWORD     = process.env.SMTP_PASSWORD;
const ANTHROPIC    = process.env.ANTHROPIC_API_KEY;
const TG_TOKEN     = process.env.TELEGRAM_BOT_TOKEN;
const TG_CHAT      = process.env.TELEGRAM_CHAT_ID;
const SUPA_URL     = process.env.SUPABASE_URL;
const SUPA_KEY     = process.env.SUPABASE_ANON_KEY;
const STATE_FILE   = path.join(__dirname, 'state.json');

// ─── State ────────────────────────────────────────────────────────────────────
function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); }
  catch { return { processedUids: [] }; }
}
function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ─── Telegram ─────────────────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function sendTelegram(text) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT, text, parse_mode: 'HTML' })
    });
    const data = await res.json();
    if (!data.ok) console.error('TG error:', JSON.stringify(data));
  } catch (e) { console.error('TG send failed:', e.message); }
}

// ─── Supabase Helpers ─────────────────────────────────────────────────────────
function parseSenderParts(raw) {
  const m = raw.match(/^(.+?)\s*<(.+?)>$/);
  if (m) return { name: m[1].trim().replace(/^"|"$/g, ''), email: m[2].trim() };
  return { name: null, email: raw.trim() };
}

async function supabaseInsertEmail({ imap_uid, from_raw, subject, body_text, received_at }) {
  const { name, email } = parseSenderParts(from_raw);
  const snippet = body_text?.replace(/\s+/g, ' ').substring(0, 120) || '';
  try {
    const res = await fetch(`${SUPA_URL}/rest/v1/mailbox_emails`, {
      method: 'POST',
      headers: {
        'apikey': SUPA_KEY,
        'Authorization': `Bearer ${SUPA_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify({
        imap_uid, from_email: email, from_name: name,
        to_email: 'valentin@trumpetstar.com',
        subject, body_text, snippet, received_at,
        folder: 'inbox', is_read: false
      })
    });
    if (!res.ok) { const t = await res.text(); console.error('Supabase UPSERT error:', t); }
  } catch (e) { console.error('Supabase upsert failed:', e.message); }
}

async function supabaseUpdateDraft(imap_uid, ai_draft) {
  try {
    const res = await fetch(`${SUPA_URL}/rest/v1/mailbox_emails?imap_uid=eq.${imap_uid}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPA_KEY,
        'Authorization': `Bearer ${SUPA_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ai_draft, ai_draft_at: new Date().toISOString() })
    });
    if (!res.ok) { const t = await res.text(); console.error('Supabase PATCH error:', t); }
  } catch (e) { console.error('Supabase patch failed:', e.message); }
}

// ─── AI Draft Generator ───────────────────────────────────────────────────────
async function generateDraft(body, subject, from) {
  const kbText = JSON.stringify(KNOWLEDGE_BASE, null, 2);

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: `Du bist Valentin, Executive Assistant von Mario Schulter (Trumpetstar – Lernplattform für Trompete).
Du erstellst präzise E-Mail-Antwort-Entwürfe für Mario – OHNE Platzhalter, MIT konkreten Infos aus der Wissensdatenbank.

WISSENSDATENBANK TRUMPETSTAR:
${kbText}

REGELN:
- Antworte IMMER in der Sprache der eingehenden E-Mail (DE/EN/ES)
- Nutze KONKRETE Preise, Links und Infos aus der Wissensdatenbank
- KEIN [PLATZHALTER] für bekannte Infos (Preis, Links, Kündigung, etc.)
- Nur [PLATZHALTER] wenn wirklich persönliche Infos fehlen (z.B. Name des Kunden)
- Stil: herzlich, motivierend, direkt – du-Form
- Unterschrift exakt: "Liebe Grüße,\\nMario Schulter | Trumpetstar | www.trumpetstar.com\\nTel: +43 664/45 30 873"
- Gib NUR den reinen E-Mail-Text zurück – keine Metadaten, keine Erklärungen`,
      messages: [{
        role: 'user',
        content: `Erstelle einen Antwort-Entwurf für diese eingehende E-Mail:

Von: ${from}
Betreff: ${subject}

---
${body.substring(0, 3000)}
---`
      }]
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.content[0].text;
}

// ─── Ensure Drafts folder exists ─────────────────────────────────────────────
async function ensureDraftsFolder(client) {
  let draftsFolder = 'Drafts';
  try {
    const boxes = await client.list();
    for (const box of boxes) {
      if (box.specialUse === '\\Drafts') return box.path;
      if (box.name.toLowerCase().includes('draft')) draftsFolder = box.path;
    }
  } catch {}
  // Create if not found
  try { await client.mailboxCreate(draftsFolder); } catch {}
  return draftsFolder;
}

// ─── Process Unseen Messages ──────────────────────────────────────────────────
async function processNewMessages(client, state) {
  let uids;
  try {
    // Suche alle UIDs die größer als der letzte bekannte UID sind (catchAll: auch bereits gelesene Mails)
    const maxKnownUid = state.processedUids.length > 0
      ? Math.max(...state.processedUids.map(u => parseInt(u) || 0))
      : 0;
    if (maxKnownUid > 0) {
      // Neue Mails: UID > maxKnownUid (egal ob gelesen oder nicht)
      const newUids = await client.search({ uid: `${maxKnownUid + 1}:*` }, { uid: true });
      // Alte ungelesene Mails (noch nicht in state): als Fallback
      const unseenUids = await client.search({ unseen: true }, { uid: true });
      const combined = [...new Set([...(newUids || []), ...(unseenUids || [])])];
      uids = combined;
    } else {
      uids = await client.search({ unseen: true }, { uid: true });
    }
  } catch (e) {
    console.error('Search error:', e.message);
    return;
  }

  if (!uids || uids.length === 0) {
    console.log(`[${ts()}] No new messages.`);
    return;
  }

  const draftsFolder = await ensureDraftsFolder(client);
  console.log(`[${ts()}] Found ${uids.length} unseen. Drafts → "${draftsFolder}"`);

  for (const uid of uids) {
    const uidStr = String(uid);
    if (state.processedUids.includes(uidStr)) continue;

    try {
      const msg = await client.fetchOne(uid, { source: true }, { uid: true });
      if (!msg) continue;

      const parsed = await simpleParser(msg.source);
      const from    = parsed.from?.text || 'Unknown';
      const subject = parsed.subject || '(Kein Betreff)';
      const msgId   = parsed.messageId || '';
      const rawBody = parsed.text || (parsed.html || '').replace(/<[^>]*>/g, ' ');

      const receivedAt = parsed.date?.toISOString() || new Date().toISOString();
      console.log(`[${ts()}] Processing: "${subject}" from ${from}`);

      // Skip bounce/system messages
      const fromLower = from.toLowerCase();
      const subjLower = subject.toLowerCase();
      if (
        fromLower.includes('mailer-daemon') ||
        fromLower.includes('postmaster') ||
        subjLower.includes('mail delivery failed') ||
        subjLower.includes('delivery status notification') ||
        subjLower.includes('undeliverable') ||
        subjLower.includes('auto-reply') ||
        subjLower.includes('out of office')
      ) {
        console.log(`[${ts()}] Skipping system/bounce message`);
        state.processedUids.push(uidStr);
        saveState(state);
        continue;
      }

      // Save to Supabase (mailbox_emails)
      await supabaseInsertEmail({ imap_uid: uid, from_raw: from, subject, body_text: rawBody, received_at: receivedAt });

      // Generate AI draft
      const draftBody = await generateDraft(rawBody, subject, from);

      // Build RFC 2822 message
      const date = new Date().toUTCString();
      const draftRaw = [
        `Date: ${date}`,
        `From: Valentin <valentin@trumpetstar.com>`,
        `To: ${from}`,
        `Subject: Re: ${subject}`,
        msgId ? `In-Reply-To: ${msgId}` : null,
        msgId ? `References: ${msgId}` : null,
        `MIME-Version: 1.0`,
        `Content-Type: text/plain; charset=UTF-8`,
        `Content-Transfer-Encoding: 8bit`,
        ``,
        draftBody
      ].filter(l => l !== null).join('\r\n');

      // Append to Drafts (IMAP)
      await client.append(draftsFolder, Buffer.from(draftRaw), ['\\Draft']);
      console.log(`[${ts()}] Draft saved → ${draftsFolder}`);

      // Update Supabase with draft
      await supabaseUpdateDraft(uid, draftBody);

      // Notify Mario via Telegram
      const preview = rawBody.replace(/\s+/g, ' ').substring(0, 120).trim();
      await sendTelegram(
        `📬 <b>Neue E-Mail → Entwurf fertig</b>\n\n` +
        `👤 <b>Von:</b> ${escapeHtml(from)}\n` +
        `📌 <b>Betreff:</b> ${escapeHtml(subject)}\n` +
        `💬 <i>${escapeHtml(preview)}…</i>\n\n` +
        `✅ Antwort-Entwurf liegt im Drafts-Ordner – bitte prüfen &amp; bestätigen.`
      );

      // Mark as processed
      state.processedUids.push(uidStr);
      if (state.processedUids.length > 500) state.processedUids = state.processedUids.slice(-250);
      saveState(state);

      console.log(`[${ts()}] ✓ Done: "${subject}"`);

    } catch (e) {
      console.error(`[${ts()}] Error on UID ${uid}:`, e.message);
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function ts() { return new Date().toISOString(); }

function makeClient() {
  return new ImapFlow({
    host: IMAP_HOST,
    port: IMAP_PORT,
    secure: true,
    auth: { user: EMAIL, pass: PASSWORD },
    logger: false,
    emitLogs: false
  });
}

// ─── Main IDLE Loop ───────────────────────────────────────────────────────────
async function run() {
  console.log(`[${ts()}] Mail-Watcher starting (${EMAIL})`);
  await loadKnowledgeBase();
  // KB stündlich neu laden (erfasst Änderungen aus dem Admin-Panel)
  setInterval(loadKnowledgeBase, 60 * 60 * 1000);
  const state = loadState();
  let retryDelay = 5000;

  while (true) {
    const client = makeClient();

    try {
      await client.connect();
      retryDelay = 5000;
      console.log(`[${ts()}] IMAP connected`);

      // Open INBOX
      await client.mailboxOpen('INBOX');

      // IDLE loop – process → IDLE → wake on EXISTS or timeout → process again
      const IDLE_TIMEOUT_MS = 25 * 60 * 1000; // 25 min – re-IDLE before IMAP server drops connection
      while (client.usable) {
        await processNewMessages(client, state);

        try {
          console.log(`[${ts()}] Entering IDLE...`);
          // Race: IDLE wakeup vs. 25-min timeout (forces reconnect to keep connection fresh)
          await Promise.race([
            client.idle(),
            new Promise(r => setTimeout(r, IDLE_TIMEOUT_MS))
          ]);
          console.log(`[${ts()}] IDLE woke up – checking for new mail...`);
        } catch (e) {
          if (!client.usable) break;
          console.error(`[${ts()}] IDLE error:`, e.message);
          await new Promise(r => setTimeout(r, 2000));
        }
      }

      try { await client.logout(); } catch {}

    } catch (err) {
      console.error(`[${ts()}] Connection error:`, err.message);
      try { await client.logout(); } catch {}
    }

    console.log(`[${ts()}] Reconnecting in ${retryDelay / 1000}s...`);
    await new Promise(r => setTimeout(r, retryDelay));
    retryDelay = Math.min(retryDelay * 2, 60000);
  }
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
