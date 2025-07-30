import { model, models, Schema } from "mongoose";

const UserSchema = new Schema(
    {
        email: {type: "string", required: true, unique: true},
        userName: {type: "string", required: true, unique: true},
        password: {type: "string", required: true, },
        isMfaActivated: {type: "boolean", required: false},
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

