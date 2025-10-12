import { PsdUtils } from "../authentication/psdUtils";
import { allowedRoles, IUser } from "../interfaces/IUser";

export interface SignUpInput extends IUser {
  confirmPassword: string;
}

export function validateSignUpInput(input: SignUpInput) {
  const signupInputerrors: Record<string, string> = {};

  if (!input.userName?.trim()) {
    signupInputerrors.userName = 'Name is required';
  }
  if (!input.userEmail?.trim()) {
    signupInputerrors.userEmail = 'Email is required';
  }
  if (!input.userPassword) {
    signupInputerrors.userPassword = 'Password is required';
  }
  if (!input.confirmPassword) {
    signupInputerrors.confirmPassword = 'Password confirmation is required';
  }

  const validated = {
    userName: input.userName.trim(),
    userEmail: input.userEmail.trim().toLowerCase(),
    userPassword: input.userPassword,
    confirmPassword: input.confirmPassword,
    isMfaEnabled: input.isMfaEnabled ?? false,
    roles: Array.isArray(input.roles) && input.roles.length > 0
      ? input.roles.filter(r => allowedRoles.includes(r))
      : ['user'],
  };

  if (validated.roles.length === 0) {
    validated.roles = ['user'];
  }

  return { validated, errors: signupInputerrors, isValid: Object.keys(signupInputerrors).length === 0 };
}

export function verifySignupInput(input: SignUpInput) {
  const signupInputerrors: Record<string, string> = {};
  const emailValidation = PsdUtils.validateEmail(input.userEmail);
  const passwordValidation = PsdUtils.validatePassword(input.userPassword);
  
  if (!emailValidation) {
    signupInputerrors.userEmail = 'Invalid Email format'
  }
  if (input.userPassword !== input.confirmPassword) {
    signupInputerrors.confirmPassword = 'Passwords do not match'
  }
  if (!passwordValidation.valid) {
    signupInputerrors.userPassword = passwordValidation.message ?? 'Invalid password format'
  }

  const verified = {
    userName: input.userName.trim(),
    userEmail: input.userEmail.trim().toLowerCase(),
    userPassword: input.userPassword,
    //confirmPassword: input.confirmPassword,
    isMfaEnabled: input.isMfaEnabled ?? false,
    roles: Array.isArray(input.roles) && input.roles.length > 0
      ? input.roles.filter(r => allowedRoles.includes(r))
      : ['user'],
  }

  return { verified, errors: signupInputerrors, isVerified: Object.keys(signupInputerrors).length === 0 };
}