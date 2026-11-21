import { getSettings, saveSettings } from '../../utils/storage.js';

export const SUPPORTED_IDES = {
  ANTIGRAVITY: 'antigravity',
  VSCODE: 'vscode',
  CURSOR: 'cursor',
};

/**
 * Retrieves the preferred IDE configured by the user.
 * @returns {Promise<string>}
 */
export async function getPreferredIDE() {
  const settings = await getSettings();
  return settings.ide || SUPPORTED_IDES.ANTIGRAVITY;
}

/**
 * Saves the user's preferred IDE.
 * @param {string} ide
 * @returns {Promise<void>}
 */
export async function setPreferredIDE(ide) {
  if (Object.values(SUPPORTED_IDES).includes(ide)) {
    await saveSettings({ ide });
  }
}

/**
 * Generates a CLI command string for manual opening in a terminal.
 * @param {string} ide
 * @param {string} filePath
 * @param {number|null} line
 * @param {number|null} column
 * @returns {string}
 */
export function getEditorCliCommand(ide, filePath, line = 1, column = 1) {
  const location = `${filePath}:${line || 1}:${column || 1}`;
  switch (ide) {
    case SUPPORTED_IDES.CURSOR:
      return `cursor -g "${location}"`;
    case SUPPORTED_IDES.VSCODE:
      return `code -g "${location}"`;
    case SUPPORTED_IDES.ANTIGRAVITY:
    default:
      return `antigravity -g "${location}"`;
  }
}

