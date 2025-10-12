import { NextRequest, NextResponse } from "next/server";
import {
  AuthResponse,
  SignInRequest,
} from "../../../../../../lib/interfaces/IAuth";
import { PsdUtils } from "../../../../../../lib/authentication/psdUtils";
import connectDB from "../../../../../../lib/server/db";
import { User } from "../../../../../../lib/models";
import { JWTUtils } from "../../../../../../lib/authentication/jwtUtils";
import { IUser } from "../../../../../../lib/interfaces/IUser";
import { mergePublicHeadersWithCredentials } from "../../../../../../lib/server/cors";

export async function POST(
  request: NextRequest
): Promise<NextResponse<AuthResponse>> {
  try {
    const origin = request.headers.get('origin');
    await connectDB();

    const body: SignInRequest = await request.json();
    const { userEmail, userPassword } = body;

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

    // Generate JWT token
    const token = JWTUtils.generateToken({
      userId: user.userId,
      userEmail: user.userEmail,
      roles: user.roles ?? ["user"],
    });

    const sanitizedUser = PsdUtils.sanitizeUser(user);

    const response = NextResponse.json(
      {
        success: true,
        message: "Sign in successful",
        user: sanitizedUser,
        token,
      },
      {
        status: 200,
        headers: mergePublicHeadersWithCredentials(origin, {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        }),
      }
    );

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      // domain: undefined,
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    const origin = request.headers.get('origin');
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
