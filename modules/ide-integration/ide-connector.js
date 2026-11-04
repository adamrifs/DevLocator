import { getEditorUrl, getEditorCliCommand, SUPPORTED_IDES } from './ide-settings.js';

export const NATIVE_HOST_NAME = 'com.devlocator.companion';

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
export async function openSourceInIDE(payload) {
  const validation = validateOpenPayload(payload);
  if (!validation.valid) {
    return {
      success: false,
      method: 'none',
      message: validation.error,
    };
  }

  const { file, line, column, ide } = validation.data;

  // Try Chrome Native Messaging if available
  if (typeof chrome !== 'undefined' && chrome.runtime?.sendNativeMessage) {
    try {
      const nativeResult = await new Promise((resolve) => {
        chrome.runtime.sendNativeMessage(
          NATIVE_HOST_NAME,
          { file, line, column, ide },
          (response) => {
            if (chrome.runtime.lastError) {
              resolve({
                success: false,
                error: chrome.runtime.lastError.message,
              });
            } else {
              resolve(response || { success: true });
            }
          }
        );
      });

      if (nativeResult.success) {
        return {
          success: true,
          method: 'native',
          message: nativeResult.message || `Successfully launched in ${ide}`,
        };
      }
    } catch (err) {
      console.warn('[DevLocator] Native messaging failed, falling back to URL protocol:', err);
    }
  }

  // Fallback 1: Browser URL protocol (vscode://, cursor://, antigravity://)
  try {
    const url = getEditorUrl(ide, file, line, column);
    if (typeof window !== 'undefined') {
      const link = document.createElement('a');
      link.href = url;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return {
        success: true,
        method: 'url-protocol',
        message: `Dispatched launch to ${url}`,
      };
    }
  } catch (err) {
    console.warn('[DevLocator] URL protocol launch failed:', err);
  }

  // Fallback 2: Return CLI command for user clipboard
  const cliCmd = getEditorCliCommand(ide, file, line, column);
  return {
    success: false,
    method: 'fallback-cli',
    message: `Native host not connected. Run command: ${cliCmd}`,
    cliCommand: cliCmd,
  };
}

