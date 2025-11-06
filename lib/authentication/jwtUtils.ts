import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { DecodedToken, JWTPayload } from '../interfaces/IAuth';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET || "ItIsJWTSecret";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;
const JWT_EXPIRES_IN = '7d';
const REFRESH_TOKEN_EXPIRES_IN = '30d';

export class JWTUtils {

  static parseToSeconds(timeStr: string): number {
    const regex = /^(\d+)(ms|s|m|h|d)$/i;
    const match = timeStr.match(regex);

    if (!match) {
      throw new Error(
        `Invalid time format: "${timeStr}". Expected formats like "7d", "1h", "30m", "15s", or "100ms".`
      );
    }

    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();

    const unitMultipliers: Record<string, number> = {
      ms: 1 / 1000,
      s: 1,
      m: 60,
      h: 60 * 60,
      d: 24 * 60 * 60,
    };

    return value * unitMultipliers[unit];
  }

  static generateToken(payload: JWTPayload, expiresIn: string = "7d",
    useRefreshSecret: boolean = false): string {
      const secret: Secret = useRefreshSecret ? JWT_REFRESH_SECRET : JWT_SECRET;

      const options: SignOptions = {
      expiresIn: this.parseToSeconds(expiresIn),
      algorithm: "HS256",
    };
    
    return jwt.sign(payload, secret, options);
  }

  static generateAccessToken(payload: Omit<JWTPayload, "type">): string {
    return this.generateToken(
      { ...payload, type: "access" },
      "15m"
    );
  }  

  static generateRefreshToken(payload: Omit<JWTPayload, "type">): string {
    return this.generateToken(
      { ...payload, type: "refresh" },
      "7d",
      true
    );
  }

  static verifyToken(token: string, isRefreshToken: boolean = false): DecodedToken | null {
    try {
      const secret = isRefreshToken ? JWT_REFRESH_SECRET : JWT_SECRET
      const decoded = jwt.verify(token, secret) as DecodedToken;
      return decoded;
    } catch (error) {
      console.error('JWT verification failed:', error);
      return null;
    }
  }

  static decodeToken(token: string): DecodedToken | null {
    try {
      return jwt.decode(token) as DecodedToken;
    } catch (error) {
      console.error("Token decode failed:", error);
      return null;
    }
  }

  static isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return true;

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  }

  static getTokenExpiry(token: string): Date | null {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return null;

    return new Date(decoded.exp * 1000);
  }

  static refreshAccessToken(refreshToken: string): string | null {
    const decoded = this.verifyToken(refreshToken, true);
    
    if (!decoded || decoded.type !== "refresh") {
      return null;
    }

    return this.generateAccessToken({
      userId: decoded.userId,
      userEmail: decoded.userEmail,
      roles: decoded.roles,
    });
  }
}