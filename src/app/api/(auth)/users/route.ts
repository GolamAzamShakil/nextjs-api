import { NextResponse } from "next/server";
import getMongooseConnection from "../../../../../lib/server/db";
import User from "../../../../../lib/models/users";
import { Types } from "mongoose";
import { hashPassword } from "../../../../../lib/authentication/psdHashing";

const ObjectId = require("mongoose").Types.ObjectId;

export const GET = async () => {
  try {
    await getMongooseConnection();

    const users = await User.find({}, "-userPassword");

    return new NextResponse(JSON.stringify(users), { status: 200 });
  } catch (error: any) {
    return new NextResponse(
      "Error occurred during fetching users- " + error.message,
      { status: 500 }
    );
  }
};

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const { userId, userName, userEmail, userPassword, isMfaEnabled } = body;

    if (
      !userId ||
      !userName ||
      !userEmail ||
      !userPassword ||
      typeof isMfaEnabled !== "boolean"
    ) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }
    await getMongooseConnection();

    const hashedPassword = await hashPassword(userPassword);

    const newUser = new User({
      userId,
      userName,
      userEmail,
      userPassword: hashedPassword,
      isMfaEnabled,
    });
    await newUser.save();

    const { userPassword: _, ...userWithoutPassword } = newUser.toObject();

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error: any) {
    return new NextResponse(
      "Error occurred during creating user- " + error.message,
      { status: 500 }
    );
  }
};

export const PATCH = async (request: Request) => {
  try {
    const body = await request.json();
    const { userId, newUserName } = body;

    await getMongooseConnection();

    if (!userId || !newUserName) {
      return new NextResponse(
        JSON.stringify({ message: "ID or new user name not found" }),
        { status: 400 }
      );
    }

    if (!Types.ObjectId.isValid(userId)) {
      return new NextResponse(JSON.stringify({ message: "Invalid User ID" }), {
        status: 400,
      });
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { userName: newUserName },
      { new: true }
    );

    if (!updatedUser) {
      return new NextResponse(
        JSON.stringify({ message: "User is not found in database" }),
        { status: 400 }
      );
    }

    return new NextResponse(
      JSON.stringify({ message: "User is updated", user: updatedUser }),
      { status: 200 }
    );
  } catch (error: any) {
    return new NextResponse(
      "Error occurred during updating user- " + error.message,
      { status: 500 }
    );
  }
};

export const DELETE = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return new NextResponse(
        JSON.stringify({ message: "User ID not found" }),
        { status: 400 }
      );
    }

    if (!Types.ObjectId.isValid(userId)) {
      return new NextResponse(JSON.stringify({ message: "Invalid User ID" }), {
        status: 400,
      });
    }

    await getMongooseConnection();

    const deleteUser = await User.findByIdAndDelete(new Types.ObjectId(userId));

    if (!deleteUser) {
      return new NextResponse(
        JSON.stringify({ message: "User is not found in database" }),
        { status: 400 }
      );
    }

    return new NextResponse(
      JSON.stringify({
        message: "User is removed from database",
        user: deleteUser,
      }),
      { status: 200 }
    );
  } catch (error: any) {
    return new NextResponse(
      "Error occurred during removing user- " + error.message,
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
