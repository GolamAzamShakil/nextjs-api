import { NextResponse } from "next/server";
import { Types, ObjectId } from "mongoose";
import connectDB from "../../../../../../lib/db";
import User from "../../../../../../lib/models/users";
import argon2 from 'argon2';

//const ObjectId = require("mongoose").Types.ObjectId

export const GET = async ( request: Request, context: { params: any } ) => {
    const userId = context.params.user;

    try {
        await connectDB();

        let userFind = await User.findOne({userId: userId}, '-userPassword');

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
        return new NextResponse("Error occurred during fetching user- " + error.message, { status: 500 })
    }
}

export const POST = async (request: Request, context: { params: any }) => {
    const userId = context.params.user;
    
    try {
        const body = await request.json();
        const { userName, userEmail, userPassword, isMfaEnabled } = body;

        if (
          /* !userId || */
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
        await connectDB();

        const hashedPassword = await argon2.hash(userPassword);

        const newUser = new User({
          userId,
          userName,
          userEmail,
          userPassword: hashedPassword,
          isMfaEnabled,
        });
        await newUser.save();

        //return new NextResponse( JSON.stringify({ message: "New user is created!", user: newUser }), { status: 200 } )

        // Return user object without password
        const { userPassword: _, ...userWithoutPassword } = newUser.toObject();

        return new NextResponse(
          JSON.stringify({
            message: "User is created",
            user: userWithoutPassword,
          }),
          { status: 200 }
        );
    } catch (error: any) {
        return new NextResponse("Error occurred during creating user- " + error.message, { status: 500 })
    }
}

export const PATCH = async (request: Request, context: { params: any }) => {
    const userId = context.params.user;
    
    try {
      const body = await request.json();
      const { newUserName, isMfaEnabled } = body;

      await connectDB();

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
}


export const DELETE = async(request: Request, context: { params: any }) => {
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

        await connectDB();

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
        if (duplicateCheck.length > 0 && duplicateCheck[0].users.some((user: { userId: string | null | undefined }) => !!user.userId)) {
          console.log("\nDuplicate values- ", duplicateCheck)
          return new NextResponse(
            JSON.stringify({ message: "There exists duplicate values", values: duplicateCheck }),
            { status: 400 }
          );
        }

        const deleteUser = await User.findOneAndDelete({userId: userId});

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
}

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