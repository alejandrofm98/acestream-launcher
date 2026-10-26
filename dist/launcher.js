const ID_PATTERN = /^[a-f\d]{40}$/i;

/** Accept only a bare 40-character hex ID or exactly acestream://<ID>. */
export function parseStreamId(value) {
  if (typeof value !== 'string') return null;
  const input = value.trim();
  const match = /^(?:acestream:\/\/)?([a-f\d]{40})$/i.exec(input);
  return match ? match[1].toLowerCase() : null;
}

const CATALOG_KEY_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/;

/** Validate untrusted same-origin catalog JSON and return a minimal canonical copy. */
export function validateCatalog(value) {
  if (!Array.isArray(value)) return { ok: false, reason: 'El catálogo debe ser una lista.' };
  const channelIds = new Set();
  const catalog = [];

  for (const channel of value) {
    if (!channel || typeof channel !== 'object' || Array.isArray(channel)
      || typeof channel.id !== 'string' || !CATALOG_KEY_PATTERN.test(channel.id)
      || channelIds.has(channel.id)
      || typeof channel.name !== 'string' || !channel.name.trim()
      || !Array.isArray(channel.qualities) || channel.qualities.length === 0) {
      return { ok: false, reason: 'El catálogo contiene un canal vacío o inválido.' };
    }
    channelIds.add(channel.id);
    const qualityIds = new Set();
    const qualities = [];
    for (const quality of channel.qualities) {
      const streamId = quality && typeof quality.url === 'string' && /^acestream:\/\/[a-f\d]{40}$/i.test(quality.url)
        ? parseStreamId(quality.url)
        : null;
      if (!quality || typeof quality !== 'object' || Array.isArray(quality)
        || typeof quality.id !== 'string' || !CATALOG_KEY_PATTERN.test(quality.id)
        || qualityIds.has(quality.id)
        || typeof quality.label !== 'string' || !quality.label.trim()
        || !streamId) {
        return { ok: false, reason: 'El catálogo contiene una calidad vacía o inválida.' };
      }
      qualityIds.add(quality.id);
      qualities.push({ id: quality.id, label: quality.label.trim(), url: standardStreamUrl(streamId) });
    }
    catalog.push({ id: channel.id, name: channel.name.trim(), qualities });
  }
  return { ok: true, catalog };
}

export function findSelectedStream(catalog, channelId, qualityId) {
  if (!Array.isArray(catalog)) return null;
  const channel = catalog.find((entry) => entry.id === channelId);
  const quality = channel?.qualities.find((entry) => entry.id === qualityId);
  const id = quality ? parseStreamId(quality.url) : null;
  return id ? { channel, quality, id } : null;
}

export function detectPlatform(userAgent = '', platform = '', maxTouchPoints = 0) {
  const ua = String(userAgent);
  const devicePlatform = String(platform);
  if (/android/i.test(ua)) return 'android';
  if (/iPad|iPhone|iPod/i.test(ua) || (devicePlatform === 'MacIntel' && Number(maxTouchPoints) > 1)) return 'unsupported';
  if (/Windows|Win/i.test(devicePlatform) || /Windows/i.test(ua)) return 'windows';
  if (/Linux/i.test(devicePlatform) || /Linux/i.test(ua)) return 'linux';
  return 'unsupported';
}

/** Return a generic Android intent with an ID-free, same-page HTTP(S) fallback. */
export function buildAndroidIntent(id, pageUrl) {
  if (!ID_PATTERN.test(id)) throw new TypeError('Invalid Ace Stream ID');
  let page;
  try { page = new URL(pageUrl); } catch { return null; }
  if (page.protocol !== 'http:' && page.protocol !== 'https:') return null;
  page.username = '';
  page.password = '';
  page.search = '';
  page.hash = 'ayuda';
  const fallback = page.href;
  if (fallback.toLowerCase().includes(id.toLowerCase())) return null;
  return `intent://${id}#Intent;scheme=acestream;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;S.browser_fallback_url=${encodeURIComponent(fallback)};end`;
}

export function standardStreamUrl(id) {
  if (!ID_PATTERN.test(id)) throw new TypeError('Invalid Ace Stream ID');
  return `acestream://${id.toLowerCase()}`;
}
