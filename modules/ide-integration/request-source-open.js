import { MESSAGE_TYPES } from '../../utils/messages.js';

export function canAutoOpenSource(details) {
  return Boolean(details?.sourceFile) && (details.sourceExact || details.sourceStrategy === 'project-search');
}

export async function requestSourceOpen(details, ide) {
  const response = await chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.OPEN_SOURCE_IN_IDE,
    payload: { file: details.sourceFile, line: details.lineNumber || 1, column: details.columnNumber || 1, ide },
  });
  if (!response?.success) {
    throw new Error(response?.message || response?.error || 'Could not launch IDE directly.');
  }
  return response.message || `Opened in ${ide}!`;
}
