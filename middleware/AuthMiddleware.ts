import { NextRequest, NextResponse } from "next/server";
import { DecodedToken, JWTPayload } from "../lib/interfaces/IAuth";
import { JWTUtils } from "../lib/authentication/jwtUtils";
import { mergeAuthHeaders, mergePublicHeadersWithCredentials } from "../lib/server/cors";

export interface AuthenticatedRequest extends NextRequest {
  user?: DecodedToken;
  authMode?: "cookie" | "bearer";
}

export interface AuthMiddlewareResult {
  authorized: boolean;
  user?: DecodedToken;
  authMode?: "cookie" | "bearer";
  response?: NextResponse;
}

export interface AuthMiddlewareOptions {
  allowBoth?: boolean;
  cookieOnly?: boolean;
  bearerOnly?: boolean;
  requiredRoles?: string[];
  onUnauthorized?: (reason: string, origin: string | null) => NextResponse;
  customHeaders?: Record<string, string>;
}

export async function authMiddleware(
  request: NextRequest,
  options: AuthMiddlewareOptions = {}
): Promise<AuthMiddlewareResult> {
  const {
    allowBoth = true,
    cookieOnly = false,
    bearerOnly = false,
    requiredRoles = [],
    onUnauthorized,
    customHeaders = {},
  } = options;

  const origin = request.headers.get("origin");

  try {
    let token: string | undefined;
    let authMode: "cookie" | "bearer" | undefined;
    let isRefreshToken = false;

    // Bearer token first (if allowed)
    if (!cookieOnly) {
      const authHeader = request.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
        authMode = "bearer";
      }
    }

    // Cookie token (if allowed and no bearer token found)
    if (!bearerOnly && !token) {
      const cookieToken = request.cookies.get("jwt_auth_token")?.value;
      if (cookieToken) {
        token = cookieToken;
        authMode = "cookie";
      }
    }

    if (!token || !authMode) {
      const message = bearerOnly
        ? "No bearer token provided"
        : cookieOnly
        ? "No session cookie found"
        : "No authentication token provided";

      if (onUnauthorized) {
        return {
          authorized: false,
          response: onUnauthorized(message, origin),
        };
      }

      const baseHeaders = authMode === "bearer" || bearerOnly
        ? mergeAuthHeaders(origin)
        : mergePublicHeadersWithCredentials(origin);
      const headers = { ...baseHeaders, ...customHeaders };

      return {
        authorized: false,
        response: NextResponse.json(
          { success: false, message },
          { status: 401, headers }
        ),
      };
    }

    const decoded = JWTUtils.verifyToken(token, isRefreshToken);

    if (!decoded) {
      const message = "Invalid or expired token";

      if (onUnauthorized) {
        return {
          authorized: false,
          response: onUnauthorized(message, origin),
        };
      }

      const baseHeaders = authMode === "bearer"
        ? mergeAuthHeaders(origin)
        : mergePublicHeadersWithCredentials(origin);
      const headers = { ...baseHeaders, ...customHeaders };

      // For cookie mode, clear the invalid cookie
      const response = NextResponse.json(
        { success: false, message },
        { status: 401, headers }
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

      return {
        authorized: false,
        response,
      };
    }

    // If it's a refresh token (should not be used for auth)
    if (decoded.type === "refresh") {
      const message = "Invalid token type. Use access token for authentication";

      if (onUnauthorized) {
        return {
          authorized: false,
          response: onUnauthorized(message, origin),
        };
      }

      const baseHeaders = authMode === "bearer"
        ? mergeAuthHeaders(origin)
        : mergePublicHeadersWithCredentials(origin);
      const headers = { ...baseHeaders, ...customHeaders };

      return {
        authorized: false,
        response: NextResponse.json(
          { success: false, message },
          { status: 401, headers }
        ),
      };
    }

    if (!decoded.userId || decoded.userId.trim() === "") {
      const message = "Invalid token: Missing user identifier";

      if (onUnauthorized) {
        return {
          authorized: false,
          response: onUnauthorized(message, origin),
        };
      }

      const baseHeaders = authMode === "bearer"
        ? mergeAuthHeaders(origin)
        : mergePublicHeadersWithCredentials(origin);
      const headers = { ...baseHeaders, ...customHeaders };

      return {
        authorized: false,
        response: NextResponse.json(
          { success: false, message },
          { status: 401, headers }
        ),
      };
    }

    if (requiredRoles && requiredRoles.length > 0) {
      const userRoles = decoded.roles || [];
      const hasRequiredRole = requiredRoles.some((role) =>
        userRoles.includes(role)
      );

      if (!hasRequiredRole) {
        const message = `Access denied. Required roles: ${requiredRoles.join(", ")}`;

        if (onUnauthorized) {
          return {
            authorized: false,
            response: onUnauthorized(message, origin),
          };
        }

        const baseHeaders = authMode === "bearer"
          ? mergeAuthHeaders(origin)
          : mergePublicHeadersWithCredentials(origin);
        const headers = { ...baseHeaders, ...customHeaders };

        return {
          authorized: false,
          response: NextResponse.json(
            { success: false, message },
            { status: 403, headers }
          ),
        };
      }
    }

    return {
      authorized: true,
      user: decoded,
      authMode,
    };
  } catch (error) {
    console.error("Authentication error:", error);

    if (onUnauthorized) {
      return {
        authorized: false,
        response: onUnauthorized("Authentication failed", origin),
      };
    }

    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, message: "Authentication failed" },
        {
          status: 401,
          headers: mergePublicHeadersWithCredentials(origin),
        }
      ),
    };
  }
}


export function requireAuth(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>,
  options: AuthMiddlewareOptions = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    if (request.method === "OPTIONS") {
      const origin = request.headers.get("origin");
      const headers = options.bearerOnly
        ? mergeAuthHeaders(origin)
        : mergePublicHeadersWithCredentials(origin);
      return new NextResponse(null, { status: 204, headers });
    }

    const authResult = await authMiddleware(request, options);

    if (!authResult.authorized || authResult.response) {
      return authResult.response!;
    }

    // Add user and authMode to request
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = authResult.user;
    authenticatedRequest.authMode = authResult.authMode;

    const response = await handler(authenticatedRequest);
    const cacheControl = options.customHeaders?.["Cache-Control"];
    if (cacheControl && !response.headers.has("Cache-Control")) {
      response.headers.set("Cache-Control", cacheControl);
    }


    return response;
  };
}

// Require cookie authentication only
export function requireCookieAuth(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>,
  options: Omit<AuthMiddlewareOptions, "cookieOnly" | "bearerOnly"> = {}
) {
  return requireAuth(handler, { ...options, cookieOnly: true });
}


// Require bearer authentication only
export function requireBearerAuth(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>,
  options: Omit<AuthMiddlewareOptions, "cookieOnly" | "bearerOnly"> = {}
) {
  return requireAuth(handler, { ...options, bearerOnly: true });
}


// Require specific roles
export function requireRoles(
  roles: string[],
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>,
  options: Omit<AuthMiddlewareOptions, "requiredRoles"> = {}
) {
  return requireAuth(handler, { ...options, requiredRoles: roles });
}


// Require admin role
export function requireAdmin(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>,
  options: Omit<AuthMiddlewareOptions, "requiredRoles"> = {}
) {
  return requireRoles(["admin"], handler, options);
}


// Optional authentication (doesn't block if not authenticated)
export async function optionalAuth(
  request: NextRequest
): Promise<{ user?: DecodedToken; authMode?: "cookie" | "bearer" }> {
  const authResult = await authMiddleware(request);

  if (authResult.authorized) {
    return {
      user: authResult.user,
      authMode: authResult.authMode,
    };
  }

  return {};
}