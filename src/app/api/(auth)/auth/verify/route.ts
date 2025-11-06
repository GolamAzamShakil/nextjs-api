import { NextRequest, NextResponse } from "next/server";
import { AuthResponse, SessionRequest, SessionResponse } from "../../../../../../lib/interfaces/IAuth";
import { JWTUtils } from "../../../../../../lib/authentication/jwtUtils";
import { mergeAuthHeaders, mergePublicHeadersWithCredentials } from "../../../../../../lib/server/cors";
import { User } from "../../../../../../lib/models";
import { IUser } from "../../../../../../lib/interfaces/IUser";
import connectDB from "../../../../../../lib/server/db";
import { PsdUtils } from "../../../../../../lib/authentication/psdUtils";


export async function GET(
  request: NextRequest
): Promise<NextResponse<SessionResponse>> {
  const origin = request.headers.get("origin");

  try {
    await connectDB();

    let token: string | undefined;
    let authMode: "bearer" | "cookie" | undefined;

    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
      authMode = "bearer";
    }

    if (!token) {
      token = request.cookies.get("jwt_auth_token")?.value;
      authMode = "cookie";
    }

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "No authentication token found",
        },
        { 
          status: 401,
          headers: mergePublicHeadersWithCredentials(origin),
        }
      );
    }

    const decoded = JWTUtils.verifyToken(token, false);

    if (!decoded) {
      const response = NextResponse.json(
        {
          success: false,
          message: "Invalid or expired token",
        },
        { 
          status: 401,
          headers: authMode === "bearer" 
            ? mergeAuthHeaders(origin)
            : mergePublicHeadersWithCredentials(origin),
        }
      );

      if (authMode === "cookie") {
        response.cookies.set("jwt_auth_token", "", {
          httpOnly: true,
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
          secure: process.env.NODE_ENV === "production",
          maxAge: 0,
          path: "/",
        });
      }

      return response;
    }

    const isGuest = decoded.roles?.includes("guest") || 
                    decoded.userEmail?.startsWith("Guest_") ||
                    decoded.userId.startsWith("guest_");

    if (isGuest) {
      const guestUser = {
        userId: decoded.userId,
        userEmail: null,
        userName: decoded.userEmail || `Guest_${decoded.userId.slice(-6)}`,
        roles: decoded.roles || ["guest"],
      };

      const expiresAt = decoded.exp 
        ? new Date(decoded.exp * 1000).toISOString()
        : new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

      return NextResponse.json(
        {
          success: true,
          user: guestUser,
          session: {
            sessionId: `guest_session_${decoded.userId}`,
            userId: guestUser.userId,
            expiresAt,
          },
          authMode: "guest",
        },
        {
          status: 200,
          headers: mergePublicHeadersWithCredentials(origin, {
            "Cache-Control": "private, no-cache, must-revalidate",
          }),
        }
      );
    }

    const user = await User.findOne({ 
      userId: decoded.userId 
    }).lean<IUser>();

    if (!user) {
      const response = NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { 
          status: 401,
          headers: authMode === "bearer"
            ? mergeAuthHeaders(origin)
            : mergePublicHeadersWithCredentials(origin),
        }
      );

      if (authMode === "cookie") {
        response.cookies.set("jwt_auth_token", "", {
          httpOnly: true,
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
          secure: process.env.NODE_ENV === "production",
          maxAge: 0,
          path: "/",
        });
      }

      return response;
    }

    /* if (user.isActive === false) {
      const response = NextResponse.json(
        {
          success: false,
          message: "User account is deactivated",
        },
        { 
          status: 403,
          headers: authMode === "bearer"
            ? mergeAuthHeaders(origin)
            : mergePublicHeadersWithCredentials(origin),
        }
      );

      if (authMode === "cookie") {
        response.cookies.set("jwt_auth_token", "", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "none",
          maxAge: 0,
          path: "/",
        });
      }

      return response;
    } */


    const sanitizedUser = PsdUtils.sanitizeUser(user)

    const expiresAt = decoded.exp 
      ? new Date(decoded.exp * 1000).toISOString()
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const responseAuthMode = authMode === "bearer" ? "jwt" : "better-auth";

    return NextResponse.json(
      {
        success: true,
        user: sanitizedUser,
        session: {
          sessionId: `session_${decoded.userId}_${decoded.iat}`,
          userId: user.userId,
          expiresAt,
        },
        authMode: responseAuthMode,
      },
      {
        status: 200,
        headers: authMode === "bearer"
          ? mergeAuthHeaders(origin, {
              "Cache-Control": "private, no-cache, must-revalidate",
            })
          : mergePublicHeadersWithCredentials(origin, {
              "Cache-Control": "private, no-cache, must-revalidate",
            }),
      }
    );
  } catch (error) {
    console.error("Session verification error:", error);
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


export async function POST(
  request: NextRequest
): Promise<NextResponse<SessionResponse>> {
  const origin = request.headers.get("origin");

  try {
    const body: SessionRequest = await request.json();
    const { authType } = body;

    if (authType && authType !== "cookie" && authType !== "bearer") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid authMode. Must be 'cookie' or 'bearer'",
        },
        { 
          status: 400,
          headers: mergePublicHeadersWithCredentials(origin),
        }
      );
    }

    if (authType === "bearer") {
      const authHeader = request.headers.get("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json(
          {
            success: false,
            message: "No bearer token provided",
          },
          { 
            status: 401,
            headers: mergeAuthHeaders(origin),
          }
        );
      }

      return GET(request);
    } else if (authType === "cookie") {
      const cookieToken = request.cookies.get("jwt_auth_token")?.value;
      if (!cookieToken) {
        return NextResponse.json(
          {
            success: false,
            message: "No session cookie found",
          },
          { 
            status: 401,
            headers: mergePublicHeadersWithCredentials(origin),
          }
        );
      }

      return GET(request);
    }

    return GET(request);
  } catch (error) {
    console.error("Session verification error:", error);
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