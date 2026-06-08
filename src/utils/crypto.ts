/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Hashes an administrator password using SHA-256 via browser Web Cryptography API.
 * Includes a robust fallback hash method if executed inside a highly restricted iframe.
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(password);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
    console.warn("Web Cryptography API is unavailable or restricted. Using fallback hash.", e);
  }
  
  // Custom deterministic fallback hash for sandboxed frames
  let hash1 = 5381;
  let hash2 = 1234;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash1 = ((hash1 << 5) + hash1) + char; /* hash * 33 + c */
    hash2 = ((hash2 << 4) - hash2) + char;
  }
  return `fb-${(hash1 >>> 0).toString(16)}-${(hash2 >>> 0).toString(16)}`;
}
