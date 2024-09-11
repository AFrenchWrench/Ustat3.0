import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('Authorization')?.value;

    // Handle routes that need authentication
    if (!token) {
        // Redirect to login page if no token and if not already on the login page
        if (!request.nextUrl.pathname.startsWith('/auth')) {
            return NextResponse.redirect(new URL('/auth', request.url));
        }
        return NextResponse.next();
    }


    // Handle admin routes
    const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
    if (isAdminRoute) {
        const isAdmin = await checkIfUserIsAdmin(token);
        if (!isAdmin) {
            // Redirect to home page if not admin and not already on home page
            if (!request.nextUrl.pathname.startsWith('/')) {
                return NextResponse.redirect(new URL('/', request.url));
            }
        }
    }

    return NextResponse.next();
}

// Apply middleware to routes requiring authentication
export const config = {
    matcher: ['/admin/:path*'], // Apply middleware to admin and user routes
};

// Function to check if the user is an admin
const checkIfUserIsAdmin = async (token: string): Promise<boolean> => {
    try {
        const response = await fetch(`http://nginx/api/users/graphql/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
            },
            body: JSON.stringify({
                query: `
                    query CurrentUser {
                        currentUser {
                            isStaff
                        }
                    }
                `,
            }),
        });

        const data = await response.json();
        if (!response.ok || data.errors || !data.data.currentUser) {
            throw new Error('User is not logged in or an error occurred.');
        }

        return data.data.currentUser.isStaff;
    } catch (error) {
        console.error('Error checking if user is admin:', error);
        return false;
    }
}

