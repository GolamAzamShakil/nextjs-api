import { NextRequest, NextResponse } from "next/server";
import { SessionResponse } from "../../../../../../../lib/interfaces/IAuth";
import { JWTUtils } from "../../../../../../../lib/authentication/jwtUtils";
import { mergePublicHeadersWithCredentials } from "../../../../../../../lib/server/cors";
import { GenerateUserId } from "../../../../../../../lib/userUtilities/generateUserId";

/**
 * @openapi
 * /api/auth/signin:
 *   post:
 *     tags: [Auth]
 *     summary: signin and obtain tokens
 *     security: []
 *     description: |
 *       **Start here.** Issues both a Bearer token and a session cookie simultaneously.
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
 *                 email: admin@demo.com
 *                 password: demo1234
 *             editor:
 *               summary: "Editor — content routes only"
 *               value:
 *                 email: editor@demo.com
 *                 password: demo1234
 *             viewer:
 *               summary: "Viewer — read-only (will 403 on admin routes)"
 *               value:
 *                 email: viewer@demo.com
 *                 password: demo1234
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
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

export async function POST(
  request: NextRequest
): Promise<NextResponse<SessionResponse>> {
  const origin = request.headers.get("origin");

  try {
    const guestId = GenerateUserId.nanoidWrapper('guest');

    const guestUser = {
      userId: guestId,
      userEmail: null,
      userName: `Guest_${Date.now().toString().slice(-6)}`,
      roles: ["guest"],
    };

    const token = JWTUtils.generateToken(
      {
        userId: guestUser.userId,
        userEmail: guestUser.userName, // Use username as identifier
        roles: guestUser.roles,
      },
      "2h"
    );

    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

    const response = NextResponse.json(
      {
        success: true,
        message: "Guest session created",
        user: guestUser,
        session: {
          sessionId: `guest_session_${Date.now()}`,
          userId: guestUser.userId,
          expiresAt: expiresAt.toISOString(),
        },
      },
      {
        status: 200,
        headers: mergePublicHeadersWithCredentials(origin, {
          "Cache-Control": "private, no-cache, must-revalidate",
        }),
      }
    );

    response.cookies.set("jwt_auth_token", token, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 2,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Guest sign in error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create guest session",
      },
      { 
        status: 500,
        headers: mergePublicHeadersWithCredentials(origin),
      }
    );
  }
}