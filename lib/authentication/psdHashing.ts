import * as bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  try {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    throw new Error('Error hashing password');
  }
}

export async function verifyPassword(
  hashedPassword: string,
  plainPassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    return false;
  }
}

export function validatePasswordStrength(password: string): {
  isValid: boolean;
  message: string;
} {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }

  if (!/(?=.*[a-z])/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }

  if (!/(?=.*\d)/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }

  if (!/(?=.[@$!%?&])/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character (@$!%*?&)' };
  }

  return { isValid: true, message: 'Password meets requirements' };
}

/* export async function migratePasswordHash(
  plainPassword: string,
  existingHash: string
): Promise<{ isValid: boolean; newHash?: string }> {
  // First check if it's already a bcrypt hash
  if (existingHash.startsWith('$2a$') || existingHash.startsWith('$2b$') || existingHash.startsWith('$2y$')) {
    // Already bcrypt, just verify
    const isValid = await verifyPassword(existingHash, plainPassword);
    return { isValid };
  }
  
  try {
    const argon2 = require('argon2');
    const isValid = await argon2.verify(existingHash, plainPassword);
    
    if (isValid) {
      const newHash = await hashPassword(plainPassword);
      return { isValid: true, newHash };
    }
    
    return { isValid: false };
  } catch (error) {
    return { isValid: false };
  }
} */