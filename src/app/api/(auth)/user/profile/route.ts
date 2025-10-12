import { NextRequest, NextResponse } from "next/server";
import {
  AuthenticatedRequest,
  requireAuth,
} from "../../../../../../middleware/AuthMiddleware";
import { User } from "../../../../../../lib/models";
import { IUser } from "../../../../../../lib/interfaces/IUser";
import { mergePublicHeadersWithCredentials } from "../../../../../../lib/server/cors";
import connectDB from "../../../../../../lib/server/db";

// GET protected route
export const GET = requireAuth(async (request: AuthenticatedRequest) => {
  try {
    const origin = request.headers.get('origin');
    await connectDB();

    const user = await User.findOne({ userId: request.user?.userId })
      .select("-userPassword")
      .lean<Omit<IUser, "userPassword">>();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404, headers: mergePublicHeadersWithCredentials(origin) }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Profile retrieved successfully",
        user: {
          userId: user.userId,
          userName: user.userName,
          userEmail: user.userEmail,
          isMfaEnabled: user.isMfaEnabled,
          roles: user.roles,
        },
      },
      {
        status: 200,
        headers: mergePublicHeadersWithCredentials(origin, {
          "Cache-Control": "private, no-cache, must-revalidate",
        }),
      }
    );
  } catch (error) {
    const origin = request.headers.get('origin');
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500, headers: mergePublicHeadersWithCredentials(origin) }
    );
  }
});

// POST protected route
export const POST = requireAuth(async (request: AuthenticatedRequest) => {
  try {
    const origin = request.headers.get('origin');

    const body = await request.json();
    const { userName } = body;
    await connectDB();

    const updatedUser = await User.findOneAndUpdate(
      { userId: request.user?.userId },
      {
        userName,
        updatedAt: new Date(),
      },
      {
        new: true, // Return updated document
        runValidators: true, // Run schema validators
        select: "-userPassword",
      }
    ).lean<Omit<IUser, "userPassword">>();

    if (!updatedUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404, headers: mergePublicHeadersWithCredentials(origin) }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Profile updated successfully",
        user: {
          userId: updatedUser.userId,
          userName: updatedUser.userName,
          userEmail: updatedUser.userEmail,
          isMfaEnabled: updatedUser.isMfaEnabled,
          roles: updatedUser.roles,
        },
      },
      {
        status: 200,
        headers: mergePublicHeadersWithCredentials(origin, {
          "Cache-Control": "private, no-cache, must-revalidate",
        }),
      }
    );
  } catch (error) {
    const origin = request.headers.get('origin');
    console.error("Profile update error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500, headers: mergePublicHeadersWithCredentials(origin) }
    );
  }
});

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  return new NextResponse(null, {
    status: 204,
    headers: mergePublicHeadersWithCredentials(origin),
  });
}
