// AES-GCM encryption/decryption utility for Deno Edge Functions
// Usage: import { encrypt, decrypt } from './shared/crypto.ts';

const ENCRYPTION_KEY = Deno.env.get('ENCRYPTION_KEY'); // Must be 32 bytes (256 bits) base64

if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is not set');
}

async function getKey() {
  const raw = Uint8Array.from(atob(ENCRYPTION_KEY), c => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    'raw',
    raw,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encrypt(plainText: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plainText);
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );
  // Return base64(iv) + ':' + base64(ciphertext)
  return `${btoa(String.fromCharCode(...iv))}:${btoa(String.fromCharCode(...new Uint8Array(cipherBuffer)))}`;
}

export async function decrypt(cipherText: string): Promise<string> {
  const [ivB64, dataB64] = cipherText.split(':');
  const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
  const data = Uint8Array.from(atob(dataB64), c => c.charCodeAt(0));
  const key = await getKey();
  const plainBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  return new TextDecoder().decode(plainBuffer);
} 