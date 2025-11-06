import { NextRequest, NextResponse } from "next/server";
import {
  AuthResponse,
  SignUpRequest,
} from "../../../../../../lib/interfaces/IAuth";
import { PsdUtils } from "../../../../../../lib/authentication/psdUtils";
import { JWTUtils } from "../../../../../../lib/authentication/jwtUtils";
import connectDB from "../../../../../../lib/server/db";
import { User } from "../../../../../../lib/models";
import { IUser } from "../../../../../../lib/interfaces/IUser";
import { mergePublicHeadersWithCredentials } from "../../../../../../lib/server/cors";
import { GenerateUserId } from "../../../../../../lib/userUtilities/generateUserId";
import { validateSignUpInput, verifySignupInput } from "../../../../../../lib/validation/validateVerifySignupData";

export async function POST(
  request: NextRequest
): Promise<NextResponse<AuthResponse>> {
  try {
    const origin = request.headers.get('origin');
    await connectDB();

    const body = await request.json();
    const { validated, errors: validationErrors, isValid: validatable } = validateSignUpInput(body);
    const { verified, errors: verificationErrors, isVerified: verifiable  } = verifySignupInput(body);

    if (!validatable) {
      return NextResponse.json(
        { success: false, message: "Validation failed", error: validationErrors },
        { status: 400 }
      );
    }

    if (!verifiable) {
      return NextResponse.json(
        { success: false, message: "Verification failed", error: verificationErrors },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne(
      { userEmail: verified.userEmail },
      "-userPassword"
    ).lean<Omit<IUser, "userPassword">>();
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User with this email already exists",
        },
        { status: 409 }
      );
    }

    const hashedPassword = await PsdUtils.hashPassword(verified.userPassword);

    const newUser = await User.create({
      userId: GenerateUserId.nanoidWrapper('user'),
      userName: verified.userName,
      userEmail: verified.userEmail,
      userPassword: hashedPassword,
      isMfaEnabled: verified.isMfaEnabled,  // Boolean(isMfaEnabled)
      roles: verified.roles,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Generate JWT token
    const token = JWTUtils.generateToken({
      userId: newUser.userId,
      userEmail: newUser.userEmail,
      roles: newUser.roles ?? ["user"],
    });

    const sanitizedUser = PsdUtils.sanitizeUser(newUser);

    const response = NextResponse.json(
      {
        success: true,
        message: "User registered successfully",
        user: sanitizedUser,
        token,
      },
      {
        status: 201,
        headers: mergePublicHeadersWithCredentials(origin, {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        }),
      }
    );

    response.cookies.set("jwt_auth_token", token, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
      // domain: undefined,
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error: any) {
    const origin = request.headers.get('origin');
    console.error("Sign up error:", error);

    // MongoDB duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "User with this email already exists",
        },
        { status: 409, headers: mergePublicHeadersWithCredentials(origin) }
      );
    }

    // Mongoose validation errors
    // if (error.name === 'ValidationError') {
    //   const messages = Object.values(error.errors).map((e: any) => e.message);
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       message: messages.join(', '),
    //     },
    //     { status: 400, headers: mergePublicHeadersWithCredentials(origin), }
    //   );
    // }

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
