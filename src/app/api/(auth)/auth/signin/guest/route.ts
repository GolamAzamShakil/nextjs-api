import { NextRequest, NextResponse } from "next/server";
import { SessionResponse } from "../../../../../../../lib/interfaces/IAuth";
import { JWTUtils } from "../../../../../../../lib/authentication/jwtUtils";
import { mergePublicHeadersWithCredentials } from "../../../../../../../lib/server/cors";
import { GenerateUserId } from "../../../../../../../lib/userUtilities/generateUserId";


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