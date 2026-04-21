import { NextRequest, NextResponse } from "next/server";
import getMongooseConnection from "../../../../../../../../lib/server/db";
import {
  AuthenticatedRequest,
  requireAuth,
} from "../../../../../../../../middleware/AuthMiddleware";
import {
  mergeAuthHeaders,
  mergePublicHeadersWithCredentials,
} from "../../../../../../../../lib/server/cors";
import { User } from "../../../../../../../../lib/models";
import {
  allowedRoles,
  IUser,
} from "../../../../../../../../lib/interfaces/IUser";

/**
 * @openapi
 * /api/admin/users/{userId}/roles:
 *   get:
 *     tags: [Admin]
 *     summary: List all users (admin only)
 *     description: |
 *       Requires role: `admin`. Enforced by the RBAC dependency function — not middleware.
 *
 *       **To see RBAC in action:**
 *       - Login as `admin@demo.com` → executes successfully ✓
 *       - Login as `editor@demo.com` or `viewer@demo.com` → returns **403 Forbidden**
 * 
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     parameters:
 *       - in: path
*         name: userId
*         required: true
*         schema:
*           type: string
*         example: JohnTery41
 *     responses:
 *       200:
 *         description: User and user's roles list returned. Only reachable with admin role.
 *         headers:
 *           X-RateLimit-Limit:
 *             $ref: '#/components/headers/XRateLimitLimit'
 *           X-RateLimit-Remaining:
 *             $ref: '#/components/headers/XRateLimitRemaining'
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

// User's [user] current roles
export const GET = requireAuth(
  async (request: AuthenticatedRequest) => {
    try {
      await getMongooseConnection();
      const origin = request.headers.get("origin");
      const currentUser = request.user!;
      const currentUserId = currentUser.userId;
      const currentUserRoles = currentUser.roles;

      if (
        !currentUserRoles ||
        currentUserRoles.length < 1 ||
        !currentUserRoles.includes("admin")
      ) {
        const message =
          !currentUserRoles || currentUserRoles.length < 1
            ? "Unauthorized: User roles required"
            : "Forbidden: Admin access required";

        return NextResponse.json(
          { success: false, message },
          {
            status:
              !currentUserRoles || currentUserRoles.length < 1 ? 401 : 403,
            headers: mergePublicHeadersWithCredentials(origin),
          }
        );
      }

      const userIdentity = request.nextUrl.pathname.split("/")[4];

      const user = await User.findOne({ userIdentity })
        .select("userId userName userEmail roles")
        .lean<Omit<IUser, "userPassword">>();

      if (!user) {
        return NextResponse.json(
          { success: false, message: "User not found" },
          {
            status: 404,
            headers: mergePublicHeadersWithCredentials(origin),
          }
        );
      }

      return NextResponse.json(
        {
          success: true,
          user: {
            userId: user.userId,
            userName: user.userName,
            userEmail: user.userEmail,
            roles: user.roles,
          },
        },
        {
          status: 200,
          headers: mergePublicHeadersWithCredentials(origin),
        }
      );
    } catch (error) {
      console.error("Fetch user roles error:", error);
      const origin = request.headers.get("origin");
      return NextResponse.json(
        { success: false, message: "Internal server error" },
        {
          status: 500,
          headers: mergePublicHeadersWithCredentials(origin),
        }
      );
    }
  }, {
  customHeaders: {
    "Cache-Control": "no-store, no-cache, must-revalidate",
  }
}
);

// Update user's [user] roles
export const PUT = requireAuth(async (request: AuthenticatedRequest) => {
  try {
    await getMongooseConnection();
    const origin = request.headers.get("origin");
    const currentUser = request.user!;
    const currentUserId = currentUser.userId;
    const currentUserRoles = currentUser.roles;

    if (
      !currentUserRoles ||
      currentUserRoles.length < 1 ||
      !currentUserRoles.includes("admin")
    ) {
      const message =
        !currentUserRoles || currentUserRoles.length < 1
          ? "Unauthorized: User roles required"
          : "Forbidden: Admin access required";

      return NextResponse.json(
        { success: false, message },
        {
          status: !currentUserRoles || currentUserRoles.length < 1 ? 401 : 403,
          headers: mergePublicHeadersWithCredentials(origin),
        }
      );
    }

    const userId = request.nextUrl.pathname.split("/")[4];
    const { roles } = await request.json();

    // Prevent self-demotion (admin removing their own admin roles)
    if (userId === currentUserId && roles.includes("admin")) {
      return NextResponse.json(
        {
          success: false,
          message: "Self-demotion is not allowed.",
        },
        {
          status: 400,
          headers: mergePublicHeadersWithCredentials(origin),
        }
      );
    }

    if (!Array.isArray(roles) || roles.length === 0) {
      return NextResponse.json(
        { success: false, message: "Roles must be a non-empty array" },
        {
          status: 400,
          headers: mergePublicHeadersWithCredentials(origin),
        }
      );
    }

    const validatedRoles = roles.filter(
      (role) => typeof roles === "string" && allowedRoles.includes(role),
      //(role) => typeof role === "string" && allowedRoles.includes(role as RoleType)
      //isRole
    );

    if (validatedRoles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: `At least one valid roles required. Allowed: ${allowedRoles.join(
            ", "
          )}`,
        },
        {
          status: 400,
          headers: mergePublicHeadersWithCredentials(origin),
        }
      );
    }

    // Remove duplicates
    const uniqueRoles = [...new Set(validatedRoles)]; // const uniqueRoles = Array.from(new Set(validatedRoles));

    const existingUser = await User.findOne({ userId });
    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        {
          status: 404,
          headers: mergePublicHeadersWithCredentials(origin),
        }
      );
    }

    const updatedUser = await User.findOneAndUpdate(
      { userId },
      {
        roles: uniqueRoles,
        updatedAt: new Date(),
      },
      { new: true }
    )
      .select("-userPassword")
      .lean<Omit<IUser, "userPassword">>();

    return NextResponse.json(
      {
        success: true,
        message: "User roles updated successfully",
        user: {
          userId: updatedUser!.userId,
          userName: updatedUser!.userName,
          userEmail: updatedUser!.userEmail,
          roles: updatedUser!.roles,
        },
      },
      {
        status: 200,
        headers: mergePublicHeadersWithCredentials(origin),
      }
    );
  } catch (error) {
    console.error("Update user roles error:", error);
    const origin = request.headers.get("origin");
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      {
        status: 500,
        headers: mergePublicHeadersWithCredentials(origin),
      }
    );
  }
});

export const DELETE = requireAuth(async (request: AuthenticatedRequest) => {
  try {
    await getMongooseConnection();
    const origin = request.headers.get("origin");
    const currentUser = request.user!;
    const currentUserId = currentUser.userId;
    const currentUserRoles = currentUser.roles;

    if (
      !currentUserRoles ||
      currentUserRoles.length < 1 ||
      !currentUserRoles.includes("admin")
    ) {
      const message =
        !currentUserRoles || currentUserRoles.length < 1
          ? "Unauthorized: User roles required"
          : "Forbidden: Admin access required";

      return NextResponse.json(
        { success: false, message },
        {
          status: !currentUserRoles || currentUserRoles.length < 1 ? 401 : 403,
          headers: mergePublicHeadersWithCredentials(origin),
        }
      );
    }

    const userId = request.nextUrl.pathname.split("/")[4];
    const { roles } = await request.json();

    if (userId === currentUserId && roles.includes("admin")) {
      return NextResponse.json(
        {
          success: false,
          message: "Self-demotion is not allowed",
        },
        {
          status: 400,
          headers: mergePublicHeadersWithCredentials(origin),
        }
      );
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        {
          status: 404,
          headers: mergePublicHeadersWithCredentials(origin),
        }
      );
    }

    // Removing roles from array
    const updatedRoles = (user.roles ?? []).filter((r) => r !== roles);

    // Ensuring at least 'user' roles remains
    if (updatedRoles.length === 0) {
      updatedRoles.push("user");
    }

    const updatedUser = await User.findOneAndUpdate(
      { userId },
      {
        roles: updatedRoles,
        updatedAt: new Date(),
      },
      { new: true }
    )
      .select("-userPassword")
      .lean<Omit<IUser, "userPassword">>();

    return NextResponse.json(
      {
        success: true,
        message: `Role '${roles}' removed successfully`,
        user: {
          userId: updatedUser!.userId,
          userName: updatedUser!.userName,
          userEmail: updatedUser!.userEmail,
          roles: updatedUser!.roles,
        },
      },
      {
        status: 200,
        headers: mergePublicHeadersWithCredentials(origin),
      }
    );
  } catch (error) {
    console.error("Remove roles error:", error);
    const origin = request.headers.get("origin");
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      {
        status: 500,
        headers: mergePublicHeadersWithCredentials(origin),
      }
    );
  }
});

// OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  return new NextResponse(null, {
    status: 204,
    headers: mergePublicHeadersWithCredentials(origin),
  });
}
