import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../../../../lib/server/db";
import { AuthenticatedRequest, requireAuth } from "../../../../../../middleware/AuthMiddleware";
import { mergeAuthHeaders, mergePublicHeadersWithCredentials } from "../../../../../../lib/server/cors";
import { User } from "../../../../../../lib/models";
import { IUser } from "../../../../../../lib/interfaces/IUser";


// All users with pagination
export const GET = requireAuth(async (request: AuthenticatedRequest) => {
  try {
    await connectDB();
    const origin = request.headers.get('origin');

    // If requester is admin or not
    if (!request.user?.roles.includes('admin')) {
      return NextResponse.json(
        { success: false, message: 'Forbidden: Admin access required' },
        { 
          status: 403,
          headers: mergeAuthHeaders(origin),
        }
      );
    }

    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';

    const query: any = {};
    
    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } },
      ];
    }

    if (role) {
      query.roles = role;
    }

    const total = await User.countDocuments(query);

    const users = await User.find(query)
      .select('-userPassword')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<Omit<IUser, 'userPassword'>[]>();

    return NextResponse.json(
      {
        success: true,
        users: users.map(user => ({
          userId: user.userId,
          userName: user.userName,
          userEmail: user.userEmail,
          roles: user.roles,
          isMfaEnabled: user.isMfaEnabled,
          createdAt: user.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      { 
        status: 200,
        headers: mergePublicHeadersWithCredentials(origin, {
          'Cache-Control': 'private, no-cache',
        }),
      }
    );
  } catch (error) {
    console.error('List users error:', error);
    const origin = request.headers.get('origin');
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { 
        status: 500,
        headers: mergePublicHeadersWithCredentials(origin),
      }
    );
  }
});

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, {
    status: 204,
    headers: mergePublicHeadersWithCredentials(origin),
  });
}