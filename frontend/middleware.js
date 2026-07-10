import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// /login and /signup render Clerk's own <SignIn>/<SignUp> components and
// must stay public. "/" is also public — it shows a marketing landing page
// for signed-out visitors and the feed for signed-in users (index.js
// handles that branch itself). Everything else still requires a session.
const isPublicRoute = createRouteMatcher(["/login(.*)", "/signup(.*)", "/"]);

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