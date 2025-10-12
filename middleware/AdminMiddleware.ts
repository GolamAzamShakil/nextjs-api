import { NextRequest, NextResponse } from "next/server";
import { AuthenticatedRequest, authMiddleware, AuthMiddlewareResult } from "./AuthMiddleware";
import { JWTPayload } from "../lib/interfaces/IAuth";
import { mergePublicHeadersWithCredentials } from "../lib/server/cors";


export async function adminMiddleware(request: NextRequest): Promise<AuthMiddlewareResult> {
  const authResult = await authMiddleware(request);

  if (!authResult.authorized || authResult.response) {
    return authResult;
  }

  if (!authResult.user?.roles?.includes('admin')) {
    const origin = request.headers.get('origin');
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, message: 'Forbidden: Admin access required' },
        { 
          status: 403,
          headers: mergePublicHeadersWithCredentials(origin),
        }
      ),
    };
  }

  return { authorized: true, user: authResult.user };
}

export function requireAdmin(
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

    const adminResult = await adminMiddleware(request);

    if (!adminResult.authorized || adminResult.response) {
      return adminResult.response!;
    }

    const adminRequest = request as AuthenticatedRequest;
    adminRequest.user = adminResult.user;

    return handler(adminRequest);
  };
}