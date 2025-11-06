import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../../../../../../lib/server/db";
import { AuthenticatedRequest, requireAuth } from "../../../../../../../../middleware/AuthMiddleware";
import { mergeAuthHeaders, mergePublicHeadersWithCredentials } from "../../../../../../../../lib/server/cors";
import { User } from "../../../../../../../../lib/models";
import { allowedRoles, IUser } from "../../../../../../../../lib/interfaces/IUser";


// User's current roles
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
          headers: mergePublicHeadersWithCredentials(origin),
        }
      );
    }

    const userId = request.nextUrl.pathname.split('/')[4];

    const user = await User.findOne({ userId })
      .select('userId userName userEmail roles')
      .lean<Omit<IUser, 'userPassword'>>();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { 
          status: 404,
          headers: mergePublicHeadersWithCredentials(origin),
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          userId: user.userId,
          userName: user.userName,
          userEmail: user.userEmail,
          roles: user.roles,
        },
      },
      { 
        status: 200,
        headers: mergePublicHeadersWithCredentials(origin),
      }
    );
  } catch (error) {
    console.error('Fetch user roles error:', error);
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

// Update user's roles
export const PUT = requireAuth(async (request: AuthenticatedRequest) => {
  try {
    await connectDB();
    const origin = request.headers.get('origin');

    if (request.user?.roles && !request.user?.roles.includes('admin')) {
      return NextResponse.json(
        { success: false, message: 'Forbidden: Admin access required' },
        { 
          status: 403,
          headers: mergePublicHeadersWithCredentials(origin),
        }
      );
    }

    const userId = request.nextUrl.pathname.split('/')[4];
    const { roles } = await request.json();

    // Prevent self-demotion (admin removing their own admin role)
    if (userId === request.user.userId) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Self-demotion is not allowed.' 
        },
        { 
          status: 400,
          headers: mergePublicHeadersWithCredentials(origin),
        }
      );
    }


    if (!Array.isArray(roles) || roles.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Roles must be a non-empty array' },
        { 
          status: 400,
          headers: mergePublicHeadersWithCredentials(origin),
        }
      );
    }

    //const allowedRoles = ['user', 'admin', 'moderator'];
    const validatedRoles = roles.filter(role => 
      typeof role === 'string' && allowedRoles.includes(role)
    );

    if (validatedRoles.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `At least one valid role required. Allowed: ${allowedRoles.join(', ')}` 
        },
        { 
          status: 400,
          headers: mergePublicHeadersWithCredentials(origin),
        }
      );
    }

    // Remove duplicates
    const uniqueRoles = [...new Set(validatedRoles)];       // const uniqueRoles = Array.from(new Set(validatedRoles));


    const existingUser = await User.findOne({ userId });
    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { 
          status: 404,
          headers: mergePublicHeadersWithCredentials(origin),
        }
      );
    }

    const updatedUser = await User.findOneAndUpdate(
      { userId },
      { 
        roles: uniqueRoles,
        updatedAt: new Date(),
      },
      { new: true }
    ).select('-userPassword').lean<Omit<IUser, 'userPassword'>>();

    return NextResponse.json(
      {
        success: true,
        message: 'User roles updated successfully',
        user: {
          userId: updatedUser!.userId,
          userName: updatedUser!.userName,
          userEmail: updatedUser!.userEmail,
          roles: updatedUser!.roles,
        },
      },
      { 
        status: 200,
        headers: mergePublicHeadersWithCredentials(origin),
      }
    );
  } catch (error) {
    console.error('Update user roles error:', error);
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


export const DELETE = requireAuth(async (request: AuthenticatedRequest) => {
  try {
    await connectDB();
    const origin = request.headers.get('origin');

    if (!request.user?.roles.includes('admin')) {
      return NextResponse.json(
        { success: false, message: 'Forbidden: Admin access required' },
        { 
          status: 403,
          headers: mergePublicHeadersWithCredentials(origin),
        }
      );
    }

    const userId = request.nextUrl.pathname.split('/')[4];
    const { role } = await request.json();


    if (userId === request.user.userId && role === 'admin') {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Self-demotion is not allowed' 
        },
        { 
          status: 400,
          headers: mergePublicHeadersWithCredentials(origin),
        }
      );
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { 
          status: 404,
          headers: mergePublicHeadersWithCredentials(origin),
        }
      );
    }

    // Removing role from array
    const updatedRoles = (user.roles ?? []).filter(r => r !== role);

    // Ensuring at least 'user' role remains
    if (updatedRoles.length === 0) {
      updatedRoles.push('user');
    }

    const updatedUser = await User.findOneAndUpdate(
      { userId },
      { 
        roles: updatedRoles,
        updatedAt: new Date(),
      },
      { new: true }
    ).select('-userPassword').lean<Omit<IUser, 'userPassword'>>();

    return NextResponse.json(
      {
        success: true,
        message: `Role '${role}' removed successfully`,
        user: {
          userId: updatedUser!.userId,
          userName: updatedUser!.userName,
          userEmail: updatedUser!.userEmail,
          roles: updatedUser!.roles,
        },
      },
      { 
        status: 200,
        headers: mergePublicHeadersWithCredentials(origin),
      }
    );
  } catch (error) {
    console.error('Remove role error:', error);
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

// OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, {
    status: 204,
    headers: mergePublicHeadersWithCredentials(origin),
  });
}