import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAndroidIntent, detectPlatform, findSelectedStream, parseStreamId, standardStreamUrl, validateCatalog } from '../dist/launcher.js';

const ID = 'abcdef0123456789abcdef0123456789abcdef01';

test('parser normalizes a bare ID or exact acestream URL', () => {
  assert.equal(parseStreamId(`  ${ID.toUpperCase()} `), ID);
  assert.equal(parseStreamId(` AcEsTrEaM://${ID.toUpperCase()} `), ID);
});

test('parser rejects malformed IDs and URL additions', () => {
  for (const value of ['', `${ID}x`, `${ID.slice(1)}`, `acestream://${ID}/`, `acestream://${ID}?x=1`, `https://${ID}`, `x acestream://${ID}`]) {
    assert.equal(parseStreamId(value), null, value);
  }
});

test('platform detection handles Android, iOS and touch Mac before Linux', () => {
  assert.equal(detectPlatform('Android 15', 'Linux armv8l'), 'android');
  assert.equal(detectPlatform('iPhone OS', 'iPhone'), 'unsupported');
  assert.equal(detectPlatform('Mozilla', 'MacIntel', 5), 'unsupported');
  assert.equal(detectPlatform('Mozilla', 'Win32'), 'windows');
  assert.equal(detectPlatform('Mozilla', 'Linux x86_64'), 'linux');
  assert.equal(detectPlatform('Mozilla', 'FreeBSD'), 'unsupported');
});

test('Android intent is generic and fallback excludes ID', () => {
  const intent = buildAndroidIntent(ID, `https://example.test/launcher?source=share&id=${ID}`);
  assert.match(intent, new RegExp(`^intent://${ID}#Intent;scheme=acestream;`));
  assert.match(intent, /category=android\.intent\.category\.BROWSABLE/);
  assert.match(intent, /S\.browser_fallback_url=https%3A%2F%2Fexample\.test%2Flauncher%23ayuda/);
  assert.equal(decodeURIComponent(intent.split('S.browser_fallback_url=')[1].split(';end')[0]).includes(ID), false);
  assert.equal(buildAndroidIntent(ID, 'file:///launcher'), null);
  assert.equal(buildAndroidIntent(ID, `https://example.test/${ID}`), null);
  assert.equal(standardStreamUrl(ID.toUpperCase()), `acestream://${ID}`);
  assert.throws(() => buildAndroidIntent('bad', 'https://example.test'), TypeError);
});

const sampleCatalog = [{
  id: 'prueba',
  name: 'Canal de prueba',
  qualities: [{ id: 'original', label: 'Original', url: `AcEsTrEaM://${ID.toUpperCase()}` }],
}];

test('catalog validator accepts entries and returns a canonical copy', () => {
  const result = validateCatalog(sampleCatalog);
  assert.equal(result.ok, true);
  assert.deepEqual(result.catalog, [{
    id: 'prueba',
    name: 'Canal de prueba',
    qualities: [{ id: 'original', label: 'Original', url: `acestream://${ID}` }],
  }]);
  assert.notEqual(result.catalog, sampleCatalog);
});

test('catalog validator accepts an empty catalog and rejects duplicate or empty IDs', () => {
  assert.deepEqual(validateCatalog([]), { ok: true, catalog: [] });
  assert.equal(validateCatalog([...sampleCatalog, ...sampleCatalog]).ok, false);
  assert.equal(validateCatalog([{ ...sampleCatalog[0], id: '' }]).ok, false);
  assert.equal(validateCatalog([{ ...sampleCatalog[0], qualities: [] }]).ok, false);
  assert.equal(validateCatalog([{ ...sampleCatalog[0], qualities: [sampleCatalog[0].qualities[0], sampleCatalog[0].qualities[0]] }]).ok, false);
  assert.equal(validateCatalog([{ ...sampleCatalog[0], qualities: [{ id: '', label: 'Original', url: `acestream://${ID}` }] }]).ok, false);
});

test('catalog validator rejects malformed URLs but permits repeated stream IDs', () => {
  for (const url of [ID, ` aceStream://${ID} `, `acestream://${ID}?query`, `acestream://${ID}/extra`, `https://${ID}`]) {
    assert.equal(validateCatalog([{ ...sampleCatalog[0], qualities: [{ id: 'original', label: 'Original', url }] }]).ok, false);
  }
  const repeated = validateCatalog([...sampleCatalog, { id: 'otro', name: 'Otro', qualities: [{ id: 'calidad', label: 'Otra', url: `acestream://${ID}` }] }]);
  assert.equal(repeated.ok, true);
});

test('selection lookup returns only a quality present in the validated catalog', () => {
  const { catalog } = validateCatalog(sampleCatalog);
  assert.deepEqual(findSelectedStream(catalog, 'prueba', 'original'), {
    channel: catalog[0], quality: catalog[0].qualities[0], id: ID,
  });
  assert.equal(findSelectedStream(catalog, 'missing', 'original'), null);
  assert.equal(findSelectedStream(catalog, 'prueba', 'missing'), null);
});
