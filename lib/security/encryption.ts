import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const IV_LENGTH = 12; // AES-256-GCM recommended IV size
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey() {
  const keyBase64 = process.env.SOCIAL_OAUTH_ENCRYPTION_KEY;
  if (!keyBase64) {
    throw new Error(
      "Missing SOCIAL_OAUTH_ENCRYPTION_KEY environment variable for OAuth secret encryption"
    );
  }

  const key = Buffer.from(keyBase64, "base64");

  if (key.length !== 32) {
    throw new Error(
      "SOCIAL_OAUTH_ENCRYPTION_KEY must be a 32-byte base64-encoded string (256-bit)"
    );
  }

  return key;
}

export function encryptSecret(plaintext: string) {
  if (!plaintext) {
    return null;
  }

  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]);
}

export function decryptSecret(payload: Buffer | null) {
  if (!payload) {
    return null;
  }

  if (payload.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error("Invalid encrypted payload");
  }

  const key = getEncryptionKey();
  const iv = payload.subarray(0, IV_LENGTH);
  const authTag = payload.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = payload.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

  return decrypted.toString("utf8");
}

