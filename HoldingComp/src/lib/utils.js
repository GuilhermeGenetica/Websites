// File: src/lib/utils.js
/**
 * Utility function for "debouncing".
 * Delays the execution of a function until a certain time has passed
 * since the last time it was called. Improves performance on 'resize' events.
 *
 * @param {Function} func - The function to debounce.
 * @param {number} waitMilliseconds - The time to wait in milliseconds (default: 200).
 */
export function debounce(func, waitMilliseconds = 200) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), waitMilliseconds);
  };
}