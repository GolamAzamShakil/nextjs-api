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

/**
 * @openapi
 * /api/auth/signin:
 *   post:
 *     tags: [Auth]
 *     summary: signin and obtain tokens
 *     security: []
 *     description: |
 *       **Start here.** Issues both a Bearer token, Refresh token and a Session cookie simultaneously.
 *
 *       After executing this endpoint:
 *       - The **Bearer token** is auto-applied to all subsequent Swagger requests
 *       - The **session cookie** is stored automatically by the browser
 *
 *       Pick a role from the example dropdown to test different RBAC scenarios.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/signinRequest'
 *           examples:
 *             admin:
 *               summary: "Admin — full access"
 *               value:
 *                 userEmail: admin@demo.com
 *                 userPassword: #adminDemo1234
 *                 authMode: cookie
 *             editor:
 *               summary: "Editor — content routes only"
 *               value:
 *                 userEmail: editor@demo.com
 *                 userPassword: #editorDemo1234
 *                 authMode: cookie
 *             viewer:
 *               summary: "Viewer — content read-only"
 *               value:
 *                 userEmail: viewer@demo.com
 *                 userPassword: #viewerDemo1234
 *                 authMode: cookie
 *             user:
*               summary: "User — content read and write"
*               value:
*                 userEmail: admin@demo.com
*                 userPassword: #adminDemo1234
*                 authmode: cookie
 *             guest:
*               summary: "Guest - limited time of access"
*               value:
*                 userEmail: guest@demo.com
*                 userPassword: #guestDemo1234
*                 authmode: bearer
 *     responses:
 *       200:
 *         description: signin successful. Bearer token auto-applied by Swagger UI.
 *         headers:
 *           Set-Cookie:
 *             description: HttpOnly session cookie set automatically by the browser.
 *             schema:
 *               type: string
 *               example: "session=<jwt>; HttpOnly; Secure; SameSite=Lax; Path=/"
 *           X-Request-ID:
 *             $ref: '#/components/headers/XRequestID'
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/signinResponse'
 *       400:
*         description: Verification failed.
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       422:
*         description: Validation failed.
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/Error'
 */

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
        { status: 422 }
      );
    }

    const user = await User.findOne({ userEmail: userEmail }).lean<IUser>();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or non-existent email",
        },
        { status: 422, headers: mergePublicHeadersWithCredentials(origin) }
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
          message: "Invalid or not matching password",
        },
        { status: 422, headers: mergePublicHeadersWithCredentials(origin) }
      );
    }

    const sanitizedUser = PsdUtils.sanitizeUser(user);

    if (authMode.toLowerCase().trim() === "bearer") {
      const accessToken = JWTUtils.generateAccessToken({
        userId: user.userId,
        userEmail: user.userEmail,
        roles: user.roles?.length ? user.roles.filter(Boolean) : ["guest"] as string[],
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
        roles: user.roles?.length ? user.roles.filter(Boolean) : ["guest"] as string[],
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
