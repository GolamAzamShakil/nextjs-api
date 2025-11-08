import { NextRequest, NextResponse } from "next/server";
import {
  AuthResponse,
  SignInRequest,
} from "../../../../../../lib/interfaces/IAuth";
import { PsdUtils } from "../../../../../../lib/authentication/psdUtils";
import getMongooseConnection from "../../../../../../lib/server/db";
import { User } from "../../../../../../lib/models";
import { JWTUtils } from "../../../../../../lib/authentication/jwtUtils";
import { IUser } from "../../../../../../lib/interfaces/IUser";
import {
  mergeAuthHeaders,
  mergePublicHeadersWithCredentials,
} from "../../../../../../lib/server/cors";

export async function POST(
  request: NextRequest
): Promise<NextResponse<AuthResponse>> {
  try {
    const origin = request.headers.get("origin");
    await getMongooseConnection();

    const body: SignInRequest = await request.json();
    const { userEmail, userPassword, authMode = "cookie" } = body;

    if (!userEmail || !userPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required",
        },
        { status: 400 }
      );
    }

    if (!PsdUtils.validateEmail(userEmail)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email format",
        },
        { status: 400 }
      );
    }

    const user = await User.findOne({ userEmail: userEmail }).lean<IUser>();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401, headers: mergePublicHeadersWithCredentials(origin) }
      );
    }

    const isPasswordValid = await PsdUtils.verifyPassword(
      userPassword,
      user.userPassword
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401, headers: mergePublicHeadersWithCredentials(origin) }
      );
    }

    const sanitizedUser = PsdUtils.sanitizeUser(user);

    if (authMode === "bearer") {
      const accessToken = JWTUtils.generateAccessToken({
        userId: user.userId,
        userEmail: user.userEmail,
        roles: user.roles ?? ["user"],
      });

      const refreshToken = JWTUtils.generateRefreshToken({
        userId: user.userId,
        userEmail: user.userEmail,
      });

      // Tokens in body
      return NextResponse.json(
        {
          success: true,
          message: "Sign in successful",
          user: sanitizedUser,
          accessToken,
          refreshToken,
        },
        {
          status: 200,
          headers: mergeAuthHeaders(origin, {
            "Cache-Control": "no-store, no-cache, must-revalidate",
          }),
        }
      );
    } else {
      // Default- Cookie mode
      const token = JWTUtils.generateToken({
        userId: user.userId,
        userEmail: user.userEmail,
        roles: user.roles ?? ["user"],
      });

      const response = NextResponse.json(
        {
          success: true,
          message: "Sign in successful",
          user: sanitizedUser,
        },
        {
          status: 200,
          headers: mergePublicHeadersWithCredentials(origin, {
            "Cache-Control": "no-store, no-cache, must-revalidate",
          }),
        }
      );

      // HTTP-only cookie
      response.cookies.set("jwt_auth_token", token, {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });

      return response;
    }
  } catch (error) {
    const origin = request.headers.get("origin");
    console.error("Sign in error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500, headers: mergePublicHeadersWithCredentials(origin) }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  return new NextResponse(null, {
    status: 204,
    headers: mergePublicHeadersWithCredentials(origin),
  });
}
