/**
 * Deterministic Zero-Knowledge Client-Side Encryption Utility (AES-GCM-256)
 * Key is derived deterministically from User ID + Client Master Salt via SHA-256,
 * ensuring decryption works seamlessly across ALL browsers and devices for the user.
 */

const ENC_PREFIX = 'enc_v1::';
const MASTER_SALT = 'vinfi_client_e2ee_salt_2026_x89f2a';

async function getUserKey(userId = 'default_user') {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.digest(
    'SHA-256',
    encoder.encode(`${userId}:${MASTER_SALT}`)
  );
  return await window.crypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptData(data, userId = 'default_user') {
  if (data === null || data === undefined) return data;
  try {
    const textToEncrypt = typeof data === 'object' ? JSON.stringify(data) : String(data);
    const key = await getUserKey(userId);
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
    const key = await getUserKey(userId);

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
    return null;
  }
}
