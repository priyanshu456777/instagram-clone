import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// /login and /signup render Clerk's own <SignIn>/<SignUp> components and
// must stay public. Everything else in this app (feed, profile, etc.)
// requires a signed-in Clerk session.
const isPublicRoute = createRouteMatcher(["/login(.*)", "/signup(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Run on everything except Next.js internals and static files
    "/((?!_next|.*\\..*).*)",
  ],
};
