import 'server-only';
import { createHmac, randomBytes, createCipheriv, createDecipheriv } from 'crypto';

const CUSTOMER_LINK_EXPIRY_DAYS = 7;
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getLinkSecret(): Buffer {
  const secret = process.env.PAYMENT_LINK_SECRET?.trim();
  if (!secret || secret.length < 16) {
    throw new Error('PAYMENT_LINK_SECRET must be set and at least 16 chars (e.g. openssl rand -hex 32)');
  }
  return Buffer.from(secret.slice(0, 64), 'utf8');
}

function getEncryptionKey(): Buffer {
  const key = process.env.PAYMENT_ENCRYPTION_KEY?.trim();
  if (!key) {
    throw new Error('PAYMENT_ENCRYPTION_KEY must be set (e.g. openssl rand -hex 32)');
  }
  const buf = Buffer.from(key, 'hex');
  if (buf.length !== KEY_LENGTH) {
    throw new Error('PAYMENT_ENCRYPTION_KEY must be 32 bytes (64 hex chars)');
  }
  return buf;
}

function base64UrlEncode(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): Buffer {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64');
}

/**
 * Generate a signed token for the customer secure payment link. Expires in 7 days.
 */
export function generateCustomerToken(refCode: string): string {
  const expiry = Date.now() + CUSTOMER_LINK_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${refCode}|${expiry}`;
  const hmac = createHmac('sha256', getLinkSecret());
  hmac.update(payload);
  const sig = hmac.digest();
  const combined = `${expiry}.${sig.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`;
  return base64UrlEncode(Buffer.from(combined, 'utf8'));
}

/**
 * Verify customer token and return true if valid and not expired.
 */
export function verifyCustomerToken(refCode: string, token: string): boolean {
  try {
    const decoded = base64UrlDecode(token).toString('utf8');
    const [expiryStr, sigB64] = decoded.split('.');
    if (!expiryStr || !sigB64) return false;
    const expiry = parseInt(expiryStr, 10);
    if (Date.now() > expiry) return false;
    const payload = `${refCode}|${expiry}`;
    const hmac = createHmac('sha256', getLinkSecret());
    hmac.update(payload);
    const expected = hmac.digest().toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return sigB64 === expected;
  } catch {
    return false;
  }
}

/**
 * Encrypt a card payload (never log the plain object).
 */
export function encryptPayload(payload: Record<string, string>): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', key, iv, { authTagLength: AUTH_TAG_LENGTH });
  const json = JSON.stringify(payload);
  const encrypted = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, tag, encrypted]);
  return combined.toString('base64');
}

/**
 * Decrypt a stored payload.
 */
export function decryptPayload(encryptedB64: string): Record<string, string> {
  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedB64, 'base64');
  const iv = combined.subarray(0, IV_LENGTH);
  const tag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv('aes-256-gcm', key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(tag);
  const json = decipher.update(encrypted) + decipher.final('utf8');
  return JSON.parse(json) as Record<string, string>;
}

/**
 * Generate a one-time token for operator payment view.
 */
export function generateOperatorToken(): string {
  return randomBytes(24).toString('hex');
}
