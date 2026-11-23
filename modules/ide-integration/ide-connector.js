import { getEditorCliCommand, SUPPORTED_IDES } from './ide-settings.js';

export const NATIVE_HOST_NAME = 'com.devlocator.companion';

async function sendNativeRequest(payload, timeout = 10000) {
  let timeoutId;
  try {
    return await Promise.race([
      chrome.runtime.sendNativeMessage(NATIVE_HOST_NAME, payload),
      new Promise((resolve) => {
        timeoutId = setTimeout(() => resolve({ error: 'The IDE companion did not respond in time.' }), timeout);
      }),
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function findProjectSource(element, pageUrl, projectRoot) {
  if (!pageUrl || (!projectRoot && !pageUrl.startsWith('file:'))) {
    return { error: 'Set a local project folder for this site in DevLocator Settings.' };
  }

  try {
    const { pathname, protocol, hostname } = new URL(pageUrl);
    const result = await sendNativeRequest({
      action: 'find-source', element, projectRoot, pagePath: pathname,
      localFile: protocol === 'file:' && !hostname,
    }, 4500);
    return result?.location || (result?.error && !result.error.startsWith("Missing or invalid 'file'"))
      ? result
      : { error: 'Update the Linux IDE companion to enable project source search.' };
  } catch {
    return { error: 'Install the Linux IDE companion to search local project files.' };
  }
}

/**
 * Validates request payload before sending.
 * @param {object} payload
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateOpenPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Invalid payload: expected object' };
  }

  if (!payload.file || typeof payload.file !== 'string' || payload.file.trim().length === 0) {
    return { valid: false, error: 'Invalid file path: path must be a non-empty string' };
  }

  // Prevent command injection characters in file path
  if (/[;&|`$\n\r]/.test(payload.file)) {
    return { valid: false, error: 'Security violation: illegal characters detected in file path' };
  }

  const line = payload.line ? parseInt(payload.line, 10) : 1;
  const column = payload.column ? parseInt(payload.column, 10) : 1;

  if (isNaN(line) || line < 1) {
    return { valid: false, error: 'Invalid line number: must be a positive integer' };
  }

  if (isNaN(column) || column < 1) {
    return { valid: false, error: 'Invalid column number: must be a positive integer' };
  }

  const allowedIDEs = Object.values(SUPPORTED_IDES);
  const ide = payload.ide && allowedIDEs.includes(payload.ide) ? payload.ide : SUPPORTED_IDES.ANTIGRAVITY;

  return {
    valid: true,
    data: {
      file: payload.file.trim(),
      line,
      column,
      ide,
    },
  };
}

/**
 * Sends open request to Chrome Native Messaging host.
 * @param {object} payload - { file, line, column, ide }
 * @returns {Promise<{ success: boolean, method: string, message: string }>}
 */
export async function openSourceInIDE(payload, projectRoot) {
  const validation = validateOpenPayload(payload);
  if (!validation.valid) {
    return {
      success: false,
      method: 'none',
      message: validation.error,
    };
  }

  const { file, line, column, ide } = validation.data;
  let nativeError;

  // Try Chrome Native Messaging if available
  if (typeof chrome !== 'undefined' && chrome.runtime?.sendNativeMessage) {
    try {
      const nativeResult = await sendNativeRequest({ file, line, column, ide, projectRoot });

      if (nativeResult?.success) {
        return {
          success: true,
          method: 'native',
          message: nativeResult.message || `Successfully launched in ${ide}`,
        };
      }
      nativeError = nativeResult?.error || 'The IDE companion returned no result.';
    } catch (err) {
      nativeError = err.message;
    }
  }

  // Launching through a URL can open a different editor registered for that scheme.
  const cliCmd = getEditorCliCommand(ide, file, line, column);
  return {
    success: false,
    method: 'fallback-cli',
    message: nativeError || `Native host not connected. Run command: ${cliCmd}`,
    cliCommand: cliCmd,
  };
}

