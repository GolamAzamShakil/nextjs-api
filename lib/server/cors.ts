import { NextRequest, NextResponse } from "next/server";

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
  'https://golam-azam.vercel.app',
  // process.env.FRONTEND_URL,
].filter(Boolean);

/* const productionOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

const allowedAllOrigins = process.env.NODE_ENV === 'production'
  ? [...allowedOrigins, ...productionOrigins]
  : allowedOrigins;
 */
function isAllowedOrigin(origin: string | null): boolean {
  return origin !== null && allowedOrigins.includes(origin);
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
