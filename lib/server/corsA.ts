// lib/cors.ts
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
  'https://golam-azam.vercel.app',
];

export function getCorsHeaders(
  origin: string | null,
  options: {
    credentials?: boolean;
    additionalHeaders?: Record<string, string>;
  } = {}
): Record<string, string> {
  const { credentials = false, additionalHeaders = {} } = options;
  const isAllowed = origin && allowedOrigins.includes(origin);

  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': credentials 
      ? 'Content-Type, Authorization' 
      : 'Content-Type',
    //...(credentials && { 'Access-Control-Allow-Credentials': 'true' }),
  };

  if (credentials) {
    corsHeaders['Access-Control-Allow-Credentials'] = 'true';
  }

  return {
    ...corsHeaders,
    ...additionalHeaders,
  };
}

/* // Public route
return NextResponse.json(products, { 
  status: 200,
  headers: getCorsHeaders(origin, {
    additionalHeaders: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
    }
  })
});

// Auth route
return NextResponse.json(users, { 
  status: 200,
  headers: getCorsHeaders(origin, {
    credentials: true,
    additionalHeaders: {
      'Cache-Control': 'private, no-cache'
    }
  })
}); */