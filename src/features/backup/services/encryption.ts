import { gcm } from '@noble/ciphers/aes.js';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const KEY_ID = 'mytruck.backup.key.v1';
const MAGIC = new Uint8Array([0x4d, 0x54, 0x42, 0x31]); // "MTB1"

const toBase64 = (bytes: Uint8Array): string => {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return globalThis.btoa(bin);
};

const fromBase64 = (b64: string): Uint8Array => {
  const bin = globalThis.atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

export const getOrCreateBackupKey = async (): Promise<Uint8Array> => {
  let raw = await SecureStore.getItemAsync(KEY_ID);
  if (!raw) {
    const bytes = Crypto.getRandomBytes(32);
    raw = toBase64(bytes);
    await SecureStore.setItemAsync(KEY_ID, raw);
  }
  return fromBase64(raw);
};

export const encryptDb = async (plaintext: Uint8Array): Promise<Uint8Array> => {
  const key = await getOrCreateBackupKey();
  const iv = Crypto.getRandomBytes(12);
  const ciphertext = gcm(key, iv).encrypt(plaintext);
  const out = new Uint8Array(MAGIC.length + iv.length + ciphertext.length);
  out.set(MAGIC, 0);
  out.set(iv, MAGIC.length);
  out.set(ciphertext, MAGIC.length + iv.length);
  return out;
};

export const decryptDb = async (envelope: Uint8Array): Promise<Uint8Array> => {
  for (let i = 0; i < MAGIC.length; i++) {
    if (envelope[i] !== MAGIC[i]) throw new Error('Invalid backup envelope');
  }
  const iv = envelope.slice(MAGIC.length, MAGIC.length + 12);
  const ciphertext = envelope.slice(MAGIC.length + 12);
  const key = await getOrCreateBackupKey();
  return gcm(key, iv).decrypt(ciphertext);
};

export const bytesToBase64 = toBase64;
export const base64ToBytes = fromBase64;
