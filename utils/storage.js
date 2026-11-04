/**
 * Chrome Storage API helpers for DevLocator settings.
 */

export const DEFAULT_SETTINGS = {
  ide: 'antigravity',
  theme: 'dark',
  highlightColor: '#38bdf8',
  showTooltip: true,
  shortcut: 'Alt+Shift+X',
};

const STORAGE_KEYS = {
  SETTINGS: 'devlocator_settings',
};

/**
 * Retrieves the current settings from chrome.storage.local.
 * @returns {Promise<typeof DEFAULT_SETTINGS>}
 */
export async function getSettings() {
  try {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) {
      return { ...DEFAULT_SETTINGS };
    }
    const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
    return {
      ...DEFAULT_SETTINGS,
      ...(result[STORAGE_KEYS.SETTINGS] || {}),
    };
  } catch (error) {
    console.error('[DevLocator] Failed to load settings:', error);
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Saves partial or complete settings to chrome.storage.local.
 * @param {Partial<typeof DEFAULT_SETTINGS>} partialSettings
 * @returns {Promise<typeof DEFAULT_SETTINGS>}
 */
export async function saveSettings(partialSettings) {
  try {
    const current = await getSettings();
    const updated = { ...current, ...partialSettings };
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: updated });
    }
    return updated;
  } catch (error) {
    console.error('[DevLocator] Failed to save settings:', error);
    return { ...DEFAULT_SETTINGS, ...partialSettings };
  }
}
