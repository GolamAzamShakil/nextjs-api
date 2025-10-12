import { NextRequest, NextResponse } from "next/server";
import { AuthResponse } from "../../../../../../lib/interfaces/IAuth";
import { JWTUtils } from "../../../../../../lib/authentication/jwtUtils";
import { mergePublicHeadersWithCredentials } from "../../../../../../lib/server/cors";

export async function GET(request: NextRequest): Promise<NextResponse<AuthResponse>> {
  try {
    const origin = request.headers.get('origin');
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'No authentication token found',
        },
        { status: 401, headers: mergePublicHeadersWithCredentials(origin), }
      );
    }

    const decoded = JWTUtils.verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid or expired token',
        },
        { status: 401, headers: mergePublicHeadersWithCredentials(origin), }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Token is valid',
        user: {
          userId: decoded.userId,
          userName: '',
          userEmail: decoded.userEmail,
          roles: decoded.roles,
        },
      },
      { status: 200, headers: mergePublicHeadersWithCredentials(origin, { "Cache-Control": "no-store, no-cache, must-revalidate", }) }
    );
  } catch (error) {
    const origin = request.headers.get('origin');
    console.error('Token verification error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Token verification failed',
      },
      { status: 401, headers: mergePublicHeadersWithCredentials(origin), }
    );
  }
}