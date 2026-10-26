import { buildAndroidIntent, detectPlatform, findSelectedStream, standardStreamUrl, validateCatalog } from './launcher.js';

const form = document.querySelector('#launch-form');
const channelSelect = document.querySelector('#channel');
const qualitySelect = document.querySelector('#quality');
const catalogState = document.querySelector('#catalog-state');
const retryButton = document.querySelector('#catalog-retry');
const platformSelect = document.querySelector('#platform');
const installed = document.querySelector('#installed');
const launchButton = document.querySelector('#launch-button');
const state = document.querySelector('#launch-state');
const unsupportedNote = document.querySelector('#unsupported-note');
const standardLink = document.querySelector('#standard-link');

let catalog = null;
const initialPlatform = detectPlatform(navigator.userAgent, navigator.platform, navigator.maxTouchPoints);
platformSelect.value = initialPlatform;

function selectedStream() {
  return catalog ? findSelectedStream(catalog, channelSelect.value, qualitySelect.value) : null;
}

function setOptions(select, entries, placeholder) {
  select.replaceChildren();
  if (placeholder) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = placeholder;
    select.append(option);
  }
  for (const entry of entries) {
    const option = document.createElement('option');
    option.value = entry.id;
    option.textContent = entry.name ?? entry.label;
    select.append(option);
  }
}

function populateQualities(preferredId = 'original') {
  const channel = catalog?.find((entry) => entry.id === channelSelect.value);
  if (!channel) {
    setOptions(qualitySelect, [], '—');
    qualitySelect.disabled = true;
    return;
  }
  setOptions(qualitySelect, channel.qualities, 'Selecciona una calidad');
  const preferred = channel.qualities.some((quality) => quality.id === preferredId) ? preferredId : channel.qualities[0].id;
  qualitySelect.value = preferred;
  qualitySelect.disabled = false;
}

function sync() {
  const selection = selectedStream();
  const ready = catalog !== null && catalog.length > 0;
  const channelExists = ready && catalog.some((entry) => entry.id === channelSelect.value);
  const supported = platformSelect.value !== 'unsupported';
  launchButton.disabled = !ready || !selection || !installed.checked || !supported;
  channelSelect.disabled = !ready;
  qualitySelect.disabled = !channelExists;
  unsupportedNote.hidden = supported;

  const canUseStandardLink = Boolean(selection && installed.checked && platformSelect.value === 'android');
  standardLink.hidden = !canUseStandardLink;
  standardLink.href = canUseStandardLink ? standardStreamUrl(selection.id) : '#';
  document.querySelectorAll('.help-item').forEach((item) => {
    item.hidden = item.dataset.help !== platformSelect.value && item.dataset.help !== 'unsupported';
  });
}

async function loadCatalog() {
  catalog = null;
  channelSelect.disabled = true;
  qualitySelect.disabled = true;
  launchButton.disabled = true;
  retryButton.hidden = true;
  catalogState.textContent = 'Cargando el catálogo de canales…';
  catalogState.hidden = false;
  sync();
  try {
    const response = await fetch(new URL('./channels.json', import.meta.url), { credentials: 'same-origin' });
    if (!response.ok) throw new Error('catalog-request-failed');
    const result = validateCatalog(await response.json());
    if (!result.ok) throw new Error('catalog-invalid');
    catalog = result.catalog;
    if (catalog.length === 0) {
      catalogState.textContent = 'No hay canales disponibles en el catálogo.';
      retryButton.hidden = false;
      setOptions(channelSelect, [], 'Sin canales');
      populateQualities();
      sync();
      return;
    }
    setOptions(channelSelect, catalog.map(({ id, name }) => ({ id, name })));
    const defaultChannel = catalog.some((entry) => entry.id === 'prueba') ? 'prueba' : catalog[0].id;
    channelSelect.value = defaultChannel;
    populateQualities('original');
    catalogState.textContent = `${catalog.length} ${catalog.length === 1 ? 'canal disponible' : 'canales disponibles'}.`;
    sync();
  } catch {
    catalog = null;
    catalogState.textContent = 'No se pudo cargar un catálogo válido. Comprueba la conexión y vuelve a intentarlo.';
    retryButton.hidden = false;
    setOptions(channelSelect, [], 'Catálogo no disponible');
    setOptions(qualitySelect, [], '—');
    sync();
  }
}

channelSelect.addEventListener('change', () => {
  state.hidden = true;
  populateQualities('original');
  sync();
});
qualitySelect.addEventListener('change', () => {
  state.hidden = true;
  sync();
});
platformSelect.addEventListener('change', () => {
  state.hidden = true;
  sync();
});
installed.addEventListener('change', sync);
retryButton.addEventListener('click', loadCatalog);
standardLink.addEventListener('click', (event) => {
  const selection = selectedStream();
  if (!selection || !installed.checked || platformSelect.value !== 'android') {
    event.preventDefault();
    sync();
    return;
  }
  event.preventDefault();
  window.location.assign(standardStreamUrl(selection.id));
});
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const selection = selectedStream();
  if (!selection || !installed.checked || platformSelect.value === 'unsupported') return;
  state.hidden = false;
  const target = platformSelect.value === 'android'
    ? buildAndroidIntent(selection.id, window.location.href) || standardStreamUrl(selection.id)
    : standardStreamUrl(selection.id);
  // Keep navigation synchronous in the user's submit gesture; no probing or timer.
  window.location.assign(target);
});

sync();
loadCatalog();
