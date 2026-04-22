import { NextResponse } from "next/server";
import { Types, ObjectId } from "mongoose";
import getMongooseConnection from "../../../../../../lib/server/db";
import User from "../../../../../../lib/models/users";
import { hashPassword } from "../../../../../../lib/authentication/psdHashing";

/**
 * @openapi
 * /api/users/{userId}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by userId
 *     description: |
 *       Get user info by.
 *       providing userId in URL parameter.
 *     security: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         example: user_JohnTery41
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found in the database.
 */

//const ObjectId = require("mongoose").Types.ObjectId

export const GET = async (request: Request, context: { params: any }) => {
  const userId = context.params.user;
  const userName = userId.startsWith("user_") ? userId : null;

  try {
    await getMongooseConnection();

    let userFind = await User.findOne({ userId: userId }, "-userPassword");

    if (!userFind) {
      return new NextResponse(
        JSON.stringify({ message: "User not found in the database" }),
        {
          status: 400,
        }
      );
    }

    return new NextResponse(JSON.stringify(userFind), { status: 200 });
  } catch (error: any) {
    return new NextResponse(
      JSON.stringify({
        message: "Error occurred during fetching user",
        error: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

/**
 * @openapi
 * /api/users/{userId}:
 *   post:
 *     tags: [Users]
 *     summary: Create user by userId
 *     description: |
 *       Create new user by providing
 *       userId in URL parameter and userName, userEmail, userPassword, isMfaEnabled in request body.
 *     security: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         example: user_JohnTery41
 *     requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             examples:
 *               value:
 *                 userName: user_JohnTery41
 *                 userEmail: johntery41@demo.com
 *                 userPassword: "#Password"
 *                 isMfaEnabled: false
 *     responses:
 *       200:
 *         description: User is created.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found.
 */


export const POST = async (request: Request, context: { params: any }) => {
  const userId = context.params.user;

  try {
    const body = await request.json();
    const { userName, userEmail, userPassword, isMfaEnabled } = body;

    if (
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

    return new NextResponse(
      JSON.stringify({
        message: "User is created",
        user: userWithoutPassword,
      }),
      { status: 200 }
    );
  } catch (error: any) {
    return new NextResponse(
      "Error occurred during creating user- " + error.message,
      { status: 500 }
    );
  }
};

/**
 * @openapi
 * /api/users/{userId}:
 *   patch:
 *     tags: [Users]
 *     summary: Update user by userId
 *     description: |
 *       Update existing user by providing
 *       userId in URL parameter and newUserName, isMfaEnabled in request body.
 *     security: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         example: user_JohnTery41
 *     requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             examples:
 *               value:
 *                 newUserName: user_JohnTery41
 *                 isMfaEnabled: false
 *     responses:
 *       200:
 *         description: User is updated.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found.
 */

export const PATCH = async (request: Request, context: { params: any }) => {
  const userId = context.params.user;

  try {
    const body = await request.json();
    const { newUserName, isMfaEnabled } = body;

    await getMongooseConnection();

    if (!newUserName) {
      return new NextResponse(
        JSON.stringify({ message: "Missing required fields" }),
        { status: 400 }
      );
    }

    /* if (!Types.ObjectId.isValid(userId)) {
        return new NextResponse(
          JSON.stringify({ message: "Invalid User ID" }),
          { status: 400 }
        );
      } */

    const updatedUser = await User.findOneAndUpdate(
      /* { _id: new ObjectId(userId) }, */
      { userId: userId },
      { userName: newUserName, isMfaEnabled: isMfaEnabled },
      { new: true, upsert: false }
    );

    /* const updateUser = await User.updateOne(
        { userId: userId },
        {
          $set: {
            userName: newUserName,
            isMfaEnabled: isMfaEnabled
          }
        }
      ); */

    if (!updatedUser) {
      return new NextResponse(
        JSON.stringify({ message: "User is not found in database" }),
        { status: 400 }
      );
    }

    const { userPassword: _, ...userWithoutPassword } = updatedUser.toObject();

    return new NextResponse(
      JSON.stringify({ message: "User is updated", user: userWithoutPassword }),
      { status: 200 }
    );
  } catch (error: any) {
    return new NextResponse(
      "Error occurred during updating user- " + error.message,
      { status: 500 }
    );
  }
};

export const DELETE = async (request: Request, context: { params: any }) => {
  const userId = context.params.user;

  try {
    //const { searchParams } = new URL(request.url);
    //const userId = searchParams.get("userId");

    /* if (!userId) {
          return new NextResponse(
            JSON.stringify({ message: "User ID not found" }),
            { status: 400 }
          );
        }

        if (!Types.ObjectId.isValid(userId)) {
          return new NextResponse(
            JSON.stringify({ message: "Invalid User ID" }),
            { status: 400 }
          );
        } */

    await getMongooseConnection();

    const UPipeline = [
      { $match: { userId: userId } },

      {
        $group: {
          _id: "$userId",
          count: { $sum: 1 },
          users: { $push: "$$ROOT" },
        },
      },
      {
        $match: {
          count: { $gt: 1 },
        },
      },
    ];

    const duplicateCheck = await User.aggregate(UPipeline);

    /* const deleteUser = await User.findByIdAndDelete(
            new Types.ObjectId()
        ); */
    if (
      duplicateCheck.length > 0 &&
      duplicateCheck[0].users.some(
        (user: { userId: string | null | undefined }) => !!user.userId
      )
    ) {
      console.log("\nDuplicate values- ", duplicateCheck);
      return new NextResponse(
        JSON.stringify({
          message: "There exists duplicate values",
          values: duplicateCheck,
        }),
        { status: 400 }
      );
    }

    const deleteUser = await User.findOneAndDelete({ userId: userId });

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

/* db.user.findOne(
  { userEmail: "example@email.com" },
  { "userDetails.userPassword": 0 }
) */
