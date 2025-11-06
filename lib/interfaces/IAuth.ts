import { IUserApiResponse } from "./IFetching";
import { IUser } from "./IUser";

export interface SignUpRequest {
  userName: string;
  userEmail: string;
  userPassword: string;
  confirmPassword: string;
}

export interface SignInRequest {
  userEmail: string;
  userPassword: string;
  authMode?: "cookie" | "bearer";
}

export interface JWTPayload {
  userId: string;
  userEmail: string;
  roles?: string[];
  type?: "access" | "refresh";
}

export interface DecodedToken {
  userId: string;
  userEmail: string;
  roles?: string[];
  type?: string;
  iat?: number;
  exp?: number;
}

interface AuthResponseSuccess {
  success: true;
  message: string;
  user: IUserApiResponse; //Omit<IUser, "userPassword">;
  token?: string; // Only present when authMode is 'bearer'
  accessToken?: string; // Only present when authMode is 'bearer'
  refreshToken?: string; // Only present when authMode is 'bearer'
}

interface AuthResponseError {
  success: false;
  message: string;
}

export type AuthResponse = AuthResponseSuccess | AuthResponseError;

export type AuthMode = 'jwt' | 'better-auth' | 'cookie' | 'guest';

export interface SessionRequest {
  authType?: "cookie" | "bearer";
}

export interface SessionResponse {
  success: boolean;
  message?: string;
  user?: IUserApiResponse;
  session?: {
    sessionId: string;
    userId: string;
    expiresAt: string;
  };
  authMode?: AuthMode
}