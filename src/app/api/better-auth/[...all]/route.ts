import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "../../../../../lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { authCorsJson, getAuthCorsHeaders } from "../../../../../lib/server/cors";


export const { GET, POST } = toNextJsHandler(auth);

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = getAuthCorsHeaders(origin);
  
  return new NextResponse(null, { 
    status: 200,
    headers: corsHeaders 
  });
}

/* export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  try {
    const authResponse = await auth.handler(request);

    const response = new NextResponse(authResponse.body, {
      status: authResponse.status,
      headers: {
        ...authResponse.headers,
        ...getAuthCorsHeaders(origin)
      }
    });
    
    return response;
  } catch (error) {
    console.error('Auth GET error:', error);
    return authCorsJson(
      { error: 'Internal server error' },
      request,
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  try {
    const authResponse = await auth.handler(request);

    const response = new NextResponse(authResponse.body, {
      status: authResponse.status,
      headers: {
        ...authResponse.headers,
        ...getAuthCorsHeaders(origin)
      }
    });
    
    return response;
  } catch (error) {
    console.error('Auth POST error:', error);
    return authCorsJson(
      { error: 'Internal server error' },
      request,
      { status: 500 }
    );
  }
} */

export async function PUT(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  try {
    const authResponse = await auth.handler(request);

    const response = new NextResponse(authResponse.body, {
      status: authResponse.status,
      headers: {
        ...authResponse.headers,
        ...getAuthCorsHeaders(origin)
      }
    });
    
    return response;
  } catch (error) {
    console.error('Auth PUT error:', error);
    return authCorsJson(
      { error: 'Internal server error' },
      request,
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  try {
    const authResponse = await auth.handler(request);
 
    const response = new NextResponse(authResponse.body, {
      status: authResponse.status,
      headers: {
        ...authResponse.headers,
        ...getAuthCorsHeaders(origin)
      }
    });
    
    return response;
  } catch (error) {
    console.error('Auth DELETE error:', error);
    return authCorsJson(
      { error: 'Internal server error' },
      request,
      { status: 500 }
    );
  }
}




/* // A single handler function
export async function all(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  try {
    const authResponse = await auth.handler(request);
    
    const response = new NextResponse(authResponse.body, {
      status: authResponse.status,
      headers: {
        ...authResponse.headers,
        ...getAuthCorsHeaders(origin)
      }
    });
    
    return response;
  } catch (error) {
    console.error('Auth error:', error);
    return authCorsJson(
      { error: 'Internal server error' },
      request,
      { status: 500 }
    );
  }
}

// Export all handlers if single handler function is utilized
//export { all as GET, all as POST, all as PUT, all as DELETE, OPTIONS }; */