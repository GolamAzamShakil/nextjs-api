import { NextRequest, NextResponse } from "next/server";
import { AuthResponse } from "../../../../../../lib/interfaces/IAuth";

export async function POST(request: NextRequest): Promise<NextResponse<AuthResponse>> {
  //const origin = request.headers.get('origin');

  try {

    const response = NextResponse.json(
      {
        success: true,
        message: 'Sign out successful',
      },
      { status: 200 }
    );

    response.cookies.set('auth_token', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      // domain: undefined,
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Sign out error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}


export async function GET(request: NextRequest): Promise<NextResponse<AuthResponse>> {
  return POST(request);
}