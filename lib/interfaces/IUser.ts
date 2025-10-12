import { Document } from 'mongoose';

export interface IUser extends Document {
  userId: string;
  userName: string;
  userEmail: string;
  userPassword: string;
  isMfaEnabled?: boolean;
  roles?: string[],
  createdAt: Date,
  updatedAt: Date
};

export const allowedRoles = ['guest', 'user', 'moderator', 'admin'];

