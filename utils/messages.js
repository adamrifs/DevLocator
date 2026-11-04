/**
 * Message types for communication between popup, background, and content scripts.
 */
export const MESSAGE_TYPES = {
  START_INSPECTION: 'DEVLOCATOR_START_INSPECTION',
  STOP_INSPECTION: 'DEVLOCATOR_STOP_INSPECTION',
  GET_INSPECTION_STATUS: 'DEVLOCATOR_GET_INSPECTION_STATUS',
  INSPECTION_STATUS_CHANGED: 'DEVLOCATOR_INSPECTION_STATUS_CHANGED',
  ELEMENT_SELECTED: 'DEVLOCATOR_ELEMENT_SELECTED',
  OPEN_SOURCE_IN_IDE: 'DEVLOCATOR_OPEN_SOURCE_IN_IDE',
};

/**
 * Validates that an incoming runtime message has a valid DevLocator type.
 * @param {any} message
 * @returns {boolean}
 */
export function isValidMessage(message) {
  if (!message || typeof message !== 'object') {
    return false;
  }
  return Object.values(MESSAGE_TYPES).includes(message.type);
}
