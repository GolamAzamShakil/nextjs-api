import mongoose, { Model, Schema } from "mongoose";
import { allowedRoles, IUser } from "../interfaces/IUser";

const UserSchema = new Schema<IUser>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userName: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
      minlength: [2, "Username must be at least 2 characters"],
      maxlength: [50, "Username cannot exceed 50 characters"],
    },
    userEmail: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },
    userPassword: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
    },
    isMfaEnabled: { type: Boolean, required: false, default: false },
    roles: {
      type: [String],
      required: false,
      enum: allowedRoles,
      default: ["user"],
    },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;


/*  // Template
const = new Schema(
    {},
    {
        timestamps: true
    }
);

const = models. || model("", );

 */

