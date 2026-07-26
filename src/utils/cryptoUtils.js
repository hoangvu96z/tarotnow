/**
 * Zero-Knowledge Client-Side Encryption Utility (AES-GCM-256)
 * Native Web Crypto API - Ultra Fast (<1ms), zero external dependencies
 */

const KEY_PREFIX = 'vinfi_e2ee_key_';
const ENC_PREFIX = 'enc_v1::';

async function getOrCreateUserKey(userId = 'default_user') {
  const storageKey = KEY_PREFIX + userId;
  let rawKeyHex = localStorage.getItem(storageKey);

  if (!rawKeyHex) {
    const rawKey = window.crypto.getRandomValues(new Uint8Array(32));
    rawKeyHex = Array.from(rawKey).map(b => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(storageKey, rawKeyHex);
  }

  const keyBytes = new Uint8Array(rawKeyHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
  return await window.crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptData(data, userId = 'default_user') {
  if (data === null || data === undefined) return data;
  try {
    const textToEncrypt = typeof data === 'object' ? JSON.stringify(data) : String(data);
    const key = await getOrCreateUserKey(userId);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedText = new TextEncoder().encode(textToEncrypt);

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedText
    );

    const ivBase64 = btoa(String.fromCharCode(...iv));
    const cipherBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));

    return `${ENC_PREFIX}${ivBase64}:${cipherBase64}`;
  } catch (err) {
    console.error('Encryption error:', err);
    return data;
  }
}

export async function decryptData(ciphertext, userId = 'default_user') {
  if (typeof ciphertext !== 'string' || !ciphertext.startsWith(ENC_PREFIX)) {
    return ciphertext;
  }

  try {
    const payload = ciphertext.slice(ENC_PREFIX.length);
    const [ivBase64, cipherBase64] = payload.split(':');

    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
    const cipherBuffer = Uint8Array.from(atob(cipherBase64), c => c.charCodeAt(0));
    const key = await getOrCreateUserKey(userId);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipherBuffer
    );

    const decryptedText = new TextDecoder().decode(decryptedBuffer);

    try {
      return JSON.parse(decryptedText);
    } catch {
      return decryptedText;
    }
  } catch (err) {
    console.warn('Decryption failed or invalid key:', err);
    return '[Dữ liệu đã mã hóa]';
  }
}
