import { NextRequest, NextResponse } from "next/server";
import { mergePublicHeadersWithCredentials } from "../../../../../../lib/server/cors";

interface SignOutResponse {
  success: boolean;
  message: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<SignOutResponse>> {
  const origin = request.headers.get("origin");

  try {
    const response = NextResponse.json(
      {
        success: true,
        message: "Sign out successful",
      },
      {
        status: 200,
        headers: mergePublicHeadersWithCredentials(origin, {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        }),
      }
    );

    response.cookies.set("jwt_auth_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Sign out error:", error);
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


export async function GET(request: NextRequest): Promise<NextResponse<SignOutResponse>> {
  return POST(request);
}