/** Preserve Vimeo's unlisted access hash, without accepting an arbitrary iframe URL. */
export function vimeoPlayerUrl(videoId: string, supplied?: string): string {
  const url = new URL(`https://player.vimeo.com/video/${videoId}`);
  if (supplied) {
    try {
      const source = new URL(supplied);
      const hash = source.searchParams.get('h');
      if (source.origin === url.origin && source.pathname === url.pathname && hash && /^[a-zA-Z0-9]+$/.test(hash)) url.searchParams.set('h', hash);
    } catch { /* Ignore untrusted/invalid URLs. */ }
  }
  for (const [key, value] of Object.entries({ autoplay: '1', muted: '0', playsinline: '1', transparent: '0', dnt: '1', title: '0', byline: '0', portrait: '0', controls: '1' })) url.searchParams.set(key, value);
  return url.href;
}