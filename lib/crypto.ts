import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY || '00000000000000000000000000000000';
  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be exactly 32 bytes long');
  }
  return Buffer.from(key, 'utf8');
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
}

export function decrypt(encryptedText: string): string | null {
  const parts = encryptedText.split(':');
  
  if (parts.length !== 3) {
    return null;
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = Buffer.from(parts[1], 'hex');
  const authTag = Buffer.from(parts[2], 'hex');

  const attemptDecrypt = (keyBuffer: Buffer): string => {
    const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  };
  
  try {
    return attemptDecrypt(getEncryptionKey());
  } catch {
    // 尝试备用默认 Key（防止旧数据因 Key 不一致解密失败）
    try {
      const fallbackKey = Buffer.from('00000000000000000000000000000000', 'utf8');
      return attemptDecrypt(fallbackKey);
    } catch {
      return null;
    }
  }
}
