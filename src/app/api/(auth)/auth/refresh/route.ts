import { NextRequest, NextResponse } from "next/server";
import getMongooseConnection from "../../../../../../lib/server/db";
import { mergeAuthHeaders } from "../../../../../../lib/server/cors";
import { JWTUtils } from "../../../../../../lib/authentication/jwtUtils";
import { User } from "../../../../../../lib/models";
import { IUser } from "../../../../../../lib/interfaces/IUser";

interface RefreshRequest {
  refreshToken: string;
}

interface RefreshResponse {
  success: boolean;
  message?: string;
  accessToken?: string;
  refreshToken?: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<RefreshResponse>> {
  const origin = request.headers.get("origin");

  try {
    await getMongooseConnection();

    const body: RefreshRequest = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Refresh token is required",
        },
        {
          status: 400,
          headers: mergeAuthHeaders(origin),
        }
      );
    }

    const decoded = JWTUtils.verifyToken(refreshToken, true);

    if (!decoded) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired refresh token",
        },
        {
          status: 401,
          headers: mergeAuthHeaders(origin),
        }
      );
    }

    if (decoded.type !== "refresh") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid token type. Refresh token required",
        },
        {
          status: 401,
          headers: mergeAuthHeaders(origin),
        }
      );
    }

    const user = await User.findOne({
      userId: decoded.userId,
    }).lean<IUser>();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        {
          status: 401,
          headers: mergeAuthHeaders(origin),
        }
      );
    }

    /* if (user.isActive === false) {
      return NextResponse.json(
        {
          success: false,
          message: "User account is deactivated",
        },
        { 
          status: 403,
          headers: mergeAuthHeaders(origin),
        }
      );
    } */

    const newAccessToken = JWTUtils.generateAccessToken({
      userId: user.userId,
      userEmail: user.userEmail,
      roles: user.roles ?? ["user"],
    });

    const newRefreshToken = JWTUtils.generateRefreshToken({
      userId: user.userId,
      userEmail: user.userEmail,
    });

    return NextResponse.json(
      {
        success: true,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
      {
        status: 200,
        headers: mergeAuthHeaders(origin, {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        }),
      }
    );
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      {
        status: 500,
        headers: mergeAuthHeaders(origin),
      }
    );
  }
}
