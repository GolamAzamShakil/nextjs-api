import { randomBytes } from "crypto";
import { nanoid } from "nanoid";

export function generateId(prefix: string, length: number = 9): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 2 + length);   // .slice(2, 2 + length) 
  return `${prefix}_${timestamp}_${randomStr}`;
}

export const GenerateUserId = {
  simpleId: (): string => {
    return generateId("user");
  },

  randomString: (length: number = 32): string => {
    let result = "";
    while (result.length < length) {
      result += Math.random().toString(36).substring(2);
    }
    return result.substring(0, length);
  },

  randomStringWithDate: (length: number = 32): string => {
    const timestamp = Date.now();
    let result = "";
    while (result.length < length) {
      result += Math.random().toString(36).substring(2);
    }
    return `${timestamp}_${result.substring(0, length)}`;
  },

  randomBytesWrapper: (): string => {
    const timestamp = Date.now().toString(36); // Base36 timestamp
    const randomPart = randomBytes(6).toString("hex"); // 12 hex chars
    return `user_${timestamp}_${randomPart}`;
  },

  uuidGenerator: (): string => {
    return randomBytes(16)
      .toString("hex")
      .match(/.{1,4}/g)!
      .join("-");
  },

  mongodbObjectId: (): string => {
    const timestamp = Math.floor(Date.now() / 1000)
      .toString(16)
      .padStart(8, "0");
    const randomHex = randomBytes(8).toString("hex");
    return timestamp + randomHex;
  },

  nanoidWrapper: (prefix: string = "user", length: number = 10): string => {
    // length = 10 for url-safe
    return `${prefix}_${nanoid(length)}`;
  },
} as const;