import { NextRequest, NextResponse } from "next/server";
import { JWTPayload } from "../lib/interfaces/IAuth";
import { JWTUtils } from "../lib/authentication/jwtUtils";
import { mergePublicHeadersWithCredentials } from "../lib/server/cors";

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

export interface AuthMiddlewareResult {
  authorized: boolean;
  user?: JWTPayload;
  response?: NextResponse;
}

export async function authMiddleware(
  request: NextRequest
): Promise<AuthMiddlewareResult> {
  try {
    const origin = request.headers.get('origin');
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return {
        authorized: false,
        response: NextResponse.json(
          { success: false, message: 'No authentication token provided' },
          { 
            status: 401,
            headers: mergePublicHeadersWithCredentials(origin),
          }
        ),
      };
    }

    const decoded = JWTUtils.verifyToken(token);

    if (!decoded) {
      return {
        authorized: false,
        response: NextResponse.json(
          { success: false, message: 'Invalid or expired token' },
          { 
            status: 401,
            headers: mergePublicHeadersWithCredentials(origin),
          }
        ),
      };
    }

    return {
      authorized: true,
      user: decoded,
    };
  } catch (error) {
    const origin = request.headers.get('origin');
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, message: 'Authentication failed' },
        { 
          status: 401,
          headers: mergePublicHeadersWithCredentials(origin),
        }
      ),
    };
  }
}

export function requireAuth(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Handle OPTIONS for CORS preflight
    if (request.method === 'OPTIONS') {
      const origin = request.headers.get('origin');
      return new NextResponse(null, {
        status: 204,
        headers: mergePublicHeadersWithCredentials(origin),
      });
    }

    const authResult = await authMiddleware(request);

    if (!authResult.authorized || authResult.response) {
      return authResult.response!;
    }

    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = authResult.user;

    return handler(authenticatedRequest);
  };
}