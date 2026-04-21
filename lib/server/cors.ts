import { NextRequest, NextResponse } from "next/server";

const allowedOrigins = [].filter(Boolean) as string[]; 

const LOCALHOST_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const EXPLICIT_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const CORS_CONSTANTS = {
  METHODS: 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  PUBLIC_HEADERS: 'Content-Type',
  AUTH_HEADERS: 'Content-Type, Authorization, X-Requested-With',
  MAX_AGE: '86400', // caches the preflight request
} as const;

const HEADER_TEMPLATES = {
  common: {
    Vary: "Origin",
    "Access-Control-Max-Age": CORS_CONSTANTS.MAX_AGE,
  },
  public: {
    "Access-Control-Allow-Methods": CORS_CONSTANTS.METHODS,
    "Access-Control-Allow-Headers": CORS_CONSTANTS.PUBLIC_HEADERS,
  },
  auth: {
    "Access-Control-Allow-Methods": CORS_CONSTANTS.METHODS,
    "Access-Control-Allow-Headers": CORS_CONSTANTS.AUTH_HEADERS,
    "Access-Control-Allow-Credentials": "true",
  },
  security: {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  },
  rateLimit(limit: number, remaining: number, reset: number) {
    return {
      "X-RateLimit-Limit": String(limit),
      "X-RateLimit-Remaining": String(remaining),
      "X-RateLimit-Reset": String(reset),
    };
  },
} as const;

/* const productionOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

const allowedAllOrigins = process.env.NODE_ENV === 'production'
  ? [...allowedOrigins, ...productionOrigins]
  : allowedOrigins;
 */
function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;

  if (
    process.env.NODE_ENV === "development" &&
    LOCALHOST_PATTERN.test(origin)
  ) {
    return true;
  }

  return EXPLICIT_ORIGINS.includes(origin); 
}

export function getBaseHeaders(
  origin: string | null,
  type: "public" | "auth",
  rateLimit?: {
    limit: number;
    remaining: number;
    reset: number;
  },
  additionalHeaders: Record<string, string> = {},
): Record<string, string> {
  const isAllowed = isAllowedOrigin(origin);
  const selectedOrigin = isAllowed && origin ? origin : allowedOrigins[0];

  return {
    ...HEADER_TEMPLATES.common,
    ...HEADER_TEMPLATES.security,
    ...(type === "auth" ? HEADER_TEMPLATES.auth : HEADER_TEMPLATES.public),
    ...(rateLimit
      ? HEADER_TEMPLATES.rateLimit(
          rateLimit.limit,
          rateLimit.remaining,
          rateLimit.reset,
        )
      : {}),
    ...additionalHeaders,
    "Access-Control-Allow-Origin": selectedOrigin,
  };
}

// For PUBLIC routes
export function getPublicCorsHeaders(origin: string | null): Record<string, string> {
  const isAllowed = isAllowedOrigin(origin);
  
  return {
    'Access-Control-Allow-Origin': isAllowed && origin ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

// For AUTHENTICATED routes
export function getAuthCorsHeaders(origin: string | null): Record<string, string> {
  const isAllowed = isAllowedOrigin(origin);
  
  return {
    'Access-Control-Allow-Origin': isAllowed && origin ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export function mergePublicHeaders(
  origin: string | null,
  additionalHeaders: Record<string, string> = {}
) {
  return {
    ...getPublicCorsHeaders(origin),
    ...additionalHeaders,
  };
}

export function mergePublicHeadersWithCredentials(
  origin: string | null,
  additionalHeaders: Record<string, string> = {}
) {
  return {
    ...getPublicCorsHeaders(origin),
    'Access-Control-Allow-Credentials': 'true',
    ...additionalHeaders,
  };
}


export function mergeAuthHeaders(
  origin: string | null,
  additionalHeaders: Record<string, string> = {}
) {
  return {
    ...getAuthCorsHeaders(origin),
    ...additionalHeaders,
  };
}

// Full wrapper for public routes
export function publicCorsJson(
  data: any,
  request: NextRequest,
  options: {
    status?: number;
    headers?: Record<string, string>;
  } = {}
) {
  const origin = request.headers.get('origin');
  const corsHeaders = getPublicCorsHeaders(origin);

  return NextResponse.json(data, {
    status: options.status ?? 200,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...options.headers,
    },
  });
}

// Full wrapper for authenticated routes
export function authCorsJson(
  data: any,
  request: NextRequest,
  options: {
    status?: number;
    headers?: Record<string, string>;
  } = {}
) {
  const origin = request.headers.get('origin');
  const corsHeaders = getAuthCorsHeaders(origin);

  return NextResponse.json(data, {
    status: options.status || 200,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...options.headers,
    },
  });
}
