export const WELCOME_LANGUAGES = ['de', 'en', 'es', 'sl'] as const;
export type WelcomeLanguage = typeof WELCOME_LANGUAGES[number];
export function welcomeLanguage(value: unknown): WelcomeLanguage {
  return WELCOME_LANGUAGES.includes(value as WelcomeLanguage) ? value as WelcomeLanguage : 'de';
}
export const TEST_EMAIL = 'schulterm@me.com';
export const TEST_USER_ID = 'a9685c1e-2bf3-451d-a7b0-f30c97ce753d';
export const VOUCHER_DAYS = 3;
export function voucherFields(code: string, createdAt: string, expiresAt: string) {
  return new URLSearchParams({
    'data[code]': code, 'data[product_ids]': '346007,575565',
    'data[valid_from]': new Date(createdAt).toISOString().replace(/\.\d{3}Z$/, '+00:00'), 'data[expires_at]': new Date(expiresAt).toISOString().replace(/\.\d{3}Z$/, '+00:00'),
    'data[first_rate]': '15', 'data[other_rates]': '0',
    'data[is_count_limited]': 'Y', 'data[count_left]': '1', 'data[upgrade_policy]': 'not_valid',
  });
}
export function voucherExpiry(createdAt: string) {
  return new Date(new Date(createdAt).getTime() + VOUCHER_DAYS * 86400000).toISOString();
}
export function voucherCheckout(product: '346007' | '575565', code: string) {
  return `https://www.digistore24.com/product/${product}?voucher=${encodeURIComponent(code)}`;
}
const copy = {
  de: { subject: 'Willkommen bei Trumpetstar – dein persönlicher 15-%-Gutschein', greeting: 'Hallo', anonymous: 'Hallo!', title: 'Willkommen bei Trumpetstar!', intro: 'Schön, dass du dabei bist! Gemeinsam bringen wir deine Trompete zum Klingen – Schritt für Schritt und mit Freude an der Musik.', gift: 'Zum Start schenken wir dir 15 % auf deine erste Zahlung für Basic oder Pro.', expiry: 'Dein Gutschein ist gültig bis', terms: 'Nur einmal einlösbar, ausschließlich für die erste Zahlung. Spätere Abo-Zahlungen und Upgrades sind nicht rabattiert.', basic: 'Basic wählen', pro: 'Pro wählen', sign: 'Musikalische Grüße, Mario und Klemens', zone: 'Wiener Zeit', code: 'Dein persönlicher Gutscheincode' },
  en: { subject: 'Welcome to Trumpetstar – your personal 15% voucher', greeting: 'Hi', anonymous: 'Hello!', title: 'Welcome to Trumpetstar!', intro: 'We’re glad you’re here! Together, we’ll get your trumpet singing – one step at a time, with the joy of making music.', gift: 'To get you started, enjoy 15% off your first payment for Basic or Pro.', expiry: 'Your voucher is valid until', terms: 'Redeemable once, on the first payment only. Subsequent subscription payments and upgrades are not discounted.', basic: 'Choose Basic', pro: 'Choose Pro', sign: 'With musical wishes, Mario and Klemens', zone: 'Vienna time', code: 'Your personal voucher code' },
  es: { subject: 'Bienvenido a Trumpetstar: tu cupón personal del 15 %', greeting: 'Hola', anonymous: '¡Hola!', title: '¡Te damos la bienvenida a Trumpetstar!', intro: '¡Nos alegra que estés aquí! Juntos haremos sonar tu trompeta, paso a paso y disfrutando de la música.', gift: 'Para empezar, te regalamos un 15 % de descuento en tu primer pago de Basic o Pro.', expiry: 'Tu cupón es válido hasta el', terms: 'Se puede canjear una sola vez y únicamente en el primer pago. Los siguientes pagos de la suscripción y las mejoras de plan no tienen descuento.', basic: 'Elegir Basic', pro: 'Elegir Pro', sign: 'Un saludo musical de Mario y Klemens', zone: 'hora de Viena', code: 'Tu código de cupón personal' },
  sl: { subject: 'Dobrodošli v Trumpetstar – vaš osebni kupon za 15 % popusta', greeting: 'Živjo', anonymous: 'Živjo!', title: 'Dobrodošli v Trumpetstar!', intro: 'Veseli nas, da ste z nami! Skupaj bomo poskrbeli, da bo vaša trobenta zazvenela – korak za korakom in z veseljem do glasbe.', gift: 'Za začetek vam podarjamo 15 % popusta na prvo plačilo za Basic ali Pro.', expiry: 'Vaš kupon velja do', terms: 'Kupon lahko unovčite samo enkrat in samo za prvo plačilo. Nadaljnja plačila naročnine in nadgradnje niso znižana.', basic: 'Izberite Basic', pro: 'Izberite Pro', sign: 'Glasbeni pozdrav, Mario in Klemens', zone: 'dunajski čas', code: 'Vaša osebna koda kupona' },
};
function escape(value: string) { return value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c)); }
export function welcomeEmail(lang: WelcomeLanguage, firstName: string | null, code: string, expiresAt: string) {
  const c = copy[lang];
  const locale = { de: 'de-AT', en: 'en-GB', es: 'es-ES', sl: 'sl-SI' }[lang];
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeStyle: 'long', timeZone: 'Europe/Vienna' }).format(new Date(expiresAt));
  const greeting = firstName ? `${c.greeting} ${firstName}!` : c.anonymous;
  const expiry = `${c.expiry} ${date} (${c.zone}).`;
  const basic = voucherCheckout('346007', code), pro = voucherCheckout('575565', code);
  const button = (label: string, url: string) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" bgcolor="#FFD34E" style="background-color:#FFD34E;border-radius:6px;padding:16px"><a href="${escape(url)}" style="font:bold 17px Arial,sans-serif;color:#10213D;text-decoration:none;display:block">${escape(label)}</a></td></tr></table>`;
  const textContent = [greeting, c.title, c.intro, c.gift, `${c.code}: ${code}`, expiry, c.terms, `${c.basic}: ${basic}`, `${c.pro}: ${pro}`, c.sign, 'Trumpetstar GmbH · info@trumpetstar.com'].join('\n\n');
  const htmlContent = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background-color:#EAF3FC"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#EAF3FC"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px"><tr><td bgcolor="#008CFD" style="padding:32px 24px;background-color:#008CFD;background-image:linear-gradient(180deg,#008CFD 0%,#0068DB 40%,#0087FA 100%);color:#FFFFFF;font-family:Arial,sans-serif"><p style="margin:0 0 28px;font-size:28px;font-weight:bold">Trumpetstar</p><h1 style="font-size:26px;line-height:1.3;margin:0">${escape(c.title)}</h1></td></tr><tr><td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:28px 24px;font:16px/1.6 Arial,sans-serif;color:#10213D"><p>${escape(greeting)}</p><p>${escape(c.intro)}</p><p>${escape(c.gift)}</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" bgcolor="#EAF3FC" style="background-color:#EAF3FC;padding:20px 8px"><p style="margin:0 0 8px;font-size:14px">${escape(c.code)}</p><p style="margin:0;font:bold 24px/1.5 monospace;word-break:break-all">${escape(code)}</p></td></tr></table><p><strong>${escape(expiry)}</strong></p><p>${escape(c.terms)}</p>${button(c.basic, basic)}<p style="margin:12px 0"></p>${button(c.pro, pro)}<p style="margin-top:28px">${escape(c.sign)}</p><p style="font-size:13px;color:#425675">Trumpetstar GmbH<br><a href="mailto:info@trumpetstar.com" style="color:#0068DB">info@trumpetstar.com</a></p></td></tr></table></td></tr></table></body></html>`;
  return { subject: c.subject, htmlContent, textContent };
}