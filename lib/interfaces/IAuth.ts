import { IUserApiResponse } from "./IFetching";

export interface SignUpRequest {
  userName: string;
  userEmail: string;
  userPassword: string;
  confirmPassword: string;
}

export interface SignInRequest {
  userEmail: string;
  userPassword: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: IUserApiResponse;
  token?: string;
}

export interface JWTPayload {
  userId: string;
  userEmail: string;
  roles: string[];
}