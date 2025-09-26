import { model, models, Schema } from "mongoose";
import { IUser } from "../interfaces/IUser";

const UserSchema = new Schema<IUser>(
    {
        userId: {type: "string", required: true},
        userName: {type: "string", required: true, unique: true},
        userEmail: {type: "string", required: true, unique: true},
        userPassword: {type: "string", required: true, },
        isMfaEnabled: {type: "boolean", required: false, default: false},
    },
    {
        timestamps: true,
    },
);

const User = models.User || model("User", UserSchema);

export default User;


/* 
const = new Schema(
    {},
    {
        timestamps: true
    }
);

const = models. || model("", );

 */

