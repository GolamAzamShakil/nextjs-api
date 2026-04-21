import { NextRequest, NextResponse } from "next/server";
import { mergePublicHeadersWithCredentials } from "../../../../../../lib/server/cors";

/**
 * @openapi
 * /api/auth/signout:
 *   post:
 *     tags: [Auth]
 *     summary: Signout and clear session cookie
 *     description: |
 *       Clears the session cookie. The Bearer token is stateless and
 *       expires naturally — remove it from the Authorize dialog manually.
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Signed out successfully.
 *         headers:
 *           Set-Cookie:
 *             description: Session cookie cleared (maxAge=0).
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Signed out
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

interface SignOutResponse {
  success: boolean;
  message: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<SignOutResponse>> {
  const origin = request.headers.get("origin");
  const isProd = process.env.NODE_ENV === "production";

  try {
    const response = NextResponse.json(
      {
        success: true,
        message: "Sign out successful",
      },
      {
        status: 200,
        headers: mergePublicHeadersWithCredentials(origin, {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        }),
      }
    );

    response.cookies.set("jwt_auth_token", "", {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Sign out error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { 
        status: 500,
        headers: mergePublicHeadersWithCredentials(origin),
      }
    );
  }
}


export async function GET(request: NextRequest): Promise<NextResponse<SignOutResponse>> {
  return POST(request);
}