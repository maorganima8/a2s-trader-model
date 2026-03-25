import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Admin/Mentor routes — block students
    if (pathname.startsWith("/admin") || pathname.startsWith("/mentor")) {
      if (token?.role === "STUDENT") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // Admin-only routes — block mentors
    if (pathname.startsWith("/admin/users") || pathname.startsWith("/admin/settings")) {
      if (token?.role === "MENTOR") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        // Public routes
        if (pathname.startsWith("/login") || pathname.startsWith("/setup") || pathname.startsWith("/api/webhooks")) {
          return true;
        }
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.png|api/auth).*)"],
};
