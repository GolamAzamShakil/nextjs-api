import { NextRequest, NextResponse } from "next/server";
import {
  AuthenticatedRequest,
  requireAuth,
} from "../../../../../../middleware/AuthMiddleware";
import { User } from "../../../../../../lib/models";
import { IUser } from "../../../../../../lib/interfaces/IUser";
import { mergePublicHeadersWithCredentials } from "../../../../../../lib/server/cors";
import getMongooseConnection from "../../../../../../lib/server/db";
import { left, leftInclusive, setRoles, userRoleRanking } from "../../../../../../lib/userUtilities/userRoleUtilities";

/**
 * @openapi
 * /api/user/profile:
 *   get:
 *     tags: [Protected]
 *     summary: Get current user profile
 *     description: |
 *       Accessible by any authenticated user regardless of role.
 *       Accepts either a Bearer token or a session cookie.
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: User profile returned.
 *         headers:
 *           X-RateLimit-Limit:
 *             $ref: '#/components/headers/XRateLimitLimit'
 *           X-RateLimit-Remaining:
 *             $ref: '#/components/headers/XRateLimitRemaining'
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

export const GET = requireAuth(
  async (request: AuthenticatedRequest) => {
    await getMongooseConnection();

    const user = await User.findOne({ userId: request.user?.userId })
      .select("-userPassword")
      .lean<Omit<IUser, "userPassword">>();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        //{ status: 404, headers: mergePublicHeadersWithCredentials(origin) }
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
      // {
      //   status: 200,
      //   headers: mergePublicHeadersWithCredentials(origin, {
      //     "Cache-Control": "private, no-cache, must-revalidate",
      //   }),
      // }
    );
  },
  {
    requiredRoles: [...setRoles("user", left), ...setRoles("user")],
    customHeaders: {
      "Cache-Control": "private, no-cache, must-revalidate",
    },
  },
);

/* export const = requireAuth(async (request: AuthenticatedRequest) => {
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
}); */

/**
 * @openapi
 * /api/user/profile:
 *    put:
 *     tags: [Protected]
 *     summary: Update current user profile
 *     description: |
 *       Accessible by any authenticated user regardless of role.
 *       Accepts either a Bearer token or a session cookie.
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     requestBody:
 *        required: true
 *        content:
 *            application/json:
 *                examples:
 *                    value: JohnTery41
 *     responses:
 *       200:
 *         description: User profile returned.
 *         headers:
 *           X-RateLimit-Limit:
 *             $ref: '#/components/headers/XRateLimitLimit'
 *           X-RateLimit-Remaining:
 *             $ref: '#/components/headers/XRateLimitRemaining'
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

export const PUT = requireAuth(
  async (request: AuthenticatedRequest) => {
    const body = await request.json();
    const { userName } = body;
    await getMongooseConnection();

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
      },
    ).lean<Omit<IUser, "userPassword">>();

    if (!updatedUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404, headers: mergePublicHeadersWithCredentials(origin) },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        userId: updatedUser.userId,
        userName: updatedUser.userName,
        userEmail: updatedUser.userEmail,
        isMfaEnabled: updatedUser.isMfaEnabled,
        roles: updatedUser.roles,
      },
    });
  },
  {
    requiredRoles: [...setRoles("user"), ...setRoles("user", left)],
    customHeaders: {
      "Cache-Control": "private, no-cache, must-revalidate",
    },
  },
);
