import { Document } from 'mongoose';

export interface IUser extends Document {
  userId: string;
  userName: string;
  userEmail: string;
  userPassword: string;
  isMfaEnabled?: boolean;
};

