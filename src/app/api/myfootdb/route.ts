import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import User from "../../../../lib/models/users";
import { Types } from "mongoose";
import argon2 from "argon2";

const ObjectId = require("mongoose").Types.ObjectId;

export const GET = async () => {
  try {
    await connectDB();

    const users = await User.find({}, "-userPassword");

    return new NextResponse(JSON.stringify(users), { status: 200 });
  } catch (error: any) {
    return new NextResponse(
      "Error occurred during fetching users- " + error.message,
      { status: 500 }
    );
  }
};


/* if () {
    return new NextResponse(JSON.stringify(), { status: } );
} */

/* return new NextResponse(
        "Error occurred during - " + error.message,
        { status: 500 }
); */
