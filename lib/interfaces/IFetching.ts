export interface IUserApiResponse {
  userId: string;
  userName: string;
  userEmail: string;
  isMfaEnabled?: boolean;
  roles?: string[];
}

export interface IProductApiResponse<T> {
  data: T;
  message?: string;
  status: number;
  totalCount?: number;
}

export interface IApiError {
  success: false;
  message: string;
  errors?: Record<string, string>;
}