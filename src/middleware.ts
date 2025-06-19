import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/signin(.*)", // Sign-in pages
  //"/signout(.*)", // Sign-out pages
  "/", // Allow homepage to be public
  //"/sign-out(.*)",
]);

import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect(); // Protect all other routes
  }
  const userId = (await auth()).userId;

  const pathname = req.nextUrl.pathname;
  if (userId && (pathname === "/" || pathname.startsWith("/signin"))) {
    return NextResponse.redirect(new URL("/chat", req.url));
  }

});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
