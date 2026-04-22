import { NextRequest, NextResponse } from "next/server";
import { SessionResponse } from "../../../../../../../lib/interfaces/IAuth";
import { JWTUtils } from "../../../../../../../lib/authentication/jwtUtils";
import { mergePublicHeadersWithCredentials } from "../../../../../../../lib/server/cors";
import { GenerateUserId } from "../../../../../../../lib/userUtilities/generateUserId";

/**
 * @openapi
 * /api/auth/signin/guest:
 *   post:
 *     tags: [Auth]
 *     summary: Create a guest session
 *     security: []
 *     description: |
 *       Creates a temporary guest session without any credentials.
 *       Issues a short-lived JWT (2 hours) as both a Bearer token and
 *       a HttpOnly cookie (`jwt_auth_token`).
 *
 *       No request body required — just execute directly.
 *     responses:
 *       200:
 *         description: Guest session created successfully.
 *         headers:
 *           Set-Cookie:
 *             description: |
 *               HttpOnly guest session cookie. Expires in 2 hours.
 *               `SameSite=Lax` in development, `SameSite=None; Secure` in production.
 *             schema:
 *               type: string
 *               example: "jwt_auth_token=<token>; HttpOnly; SameSite=Lax; Path=/; Max-Age=7200"
 *           Cache-Control:
 *             description: Response is private and must revalidate.
 *             schema:
 *               type: string
 *               example: "private, no-cache, must-revalidate"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GuestSigninResponse'
 *       500:
 *         description: Failed to create guest session.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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