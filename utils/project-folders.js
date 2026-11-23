export function getProjectSite(pageUrl) {
  try {
    const url = new URL(pageUrl);
    if (url.protocol === 'file:') return 'file://';
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.origin;
  } catch {
    // Browser-internal pages and unavailable tab URLs have no project mapping.
  }
  return null;
}

export async function getProjectFolder(site) {
  if (!site) return '';
  const key = `devlocator_project:${site}`;
  const result = await chrome.storage.local.get(key);
  return result[key] || '';
}

export function saveProjectFolder(site, folder) {
  const key = `devlocator_project:${site}`;
  return folder ? chrome.storage.local.set({ [key]: folder }) : chrome.storage.local.remove(key);
}
