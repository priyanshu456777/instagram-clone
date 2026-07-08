# InstaClone — Mini Instagram Clone (Week 3 Full Stack Task)

A full-stack social media application: users can sign up, create posts, like, comment, follow each other, and manage their profile — with real-time updates powered by Socket.io.

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js (Pages Router) + React + Tailwind CSS |
| Backend | Node.js + Express.js (MVC architecture) |
| Database | MongoDB + Mongoose |
| Auth | **Clerk** (hosted signup/login, sessions, security) |
| Image Upload | Multer (memory storage) + Cloudinary |
| Real-time | Socket.io (live likes, comments, notifications) |

## Folder Structure

```
instagram-clone/
├── backend/
│   ├── config/          # DB + Cloudinary + Clerk client config
│   ├── controllers/     # Business logic (auth, posts, comments, users, notifications, webhooks)
│   ├── middleware/       # auth (Clerk), upload, validators, error handling
│   ├── models/           # Mongoose schemas: User, Post, Comment, Notification
│   ├── routes/            # Express routers
│   ├── utils/              # Clerk<->Mongo sync helper, cloudinary upload helper, seed script
│   └── server.js           # App entry point + Socket.io setup
└── frontend/
    ├── components/       # Layout, Post, Profile, UI components
    ├── context/            # AuthContext (syncs Clerk session -> our Mongo profile)
    ├── lib/                 # axios instance, socket.io client
    ├── middleware.js       # Clerk route protection (runs at the edge)
    └── pages/               # Next.js routes (/, /login, /signup, /profile/[username], ...)
```

## Why Clerk instead of our own JWT auth

Clerk now owns signup, login, sessions and security (password hashing, brute-force
protection, etc.) instead of us hand-rolling it. Our backend never sees a password —
it only verifies the Clerk session token on each request and keeps a lightweight
**profile** document in MongoDB (bio, avatar, followers, saved posts, posts...) in
sync via a webhook.

```
Browser (Clerk SignIn/SignUp components)
        │  session token
        ▼
Next.js frontend  ──Bearer token──▶  Express backend  ──verifies with──▶  Clerk
                                            │
                                            ▼
                                    MongoDB "profile" doc
                                    (created/updated by the
                                     /api/webhooks/clerk route,
                                     with a self-heal fallback
                                     in authMiddleware.js)
```

## Features Implemented

**Core (from the brief):**
- ✅ User Authentication — Clerk-hosted signup/login/logout, secure sessions
- ✅ Post Creation — image upload (Cloudinary) with captions
- ✅ Feed System — paginated, infinite-scroll feed, newest first
- ✅ Like Feature — toggle like/unlike with **real-time** count updates via Socket.io
- ✅ Comment System — add/view/delete comments, live-updating via Socket.io
- ✅ Profile Page — bio, stats, posts grid, edit profile, avatar upload

**Bonus:**
- ✅ Follow / Unfollow users
- ✅ Save / Bookmark posts
- ✅ Real-time notifications (like, comment, follow)
- ✅ User search
- ✅ Dark mode UI (default theme, matches the design brief)
- ⚙️ Deploy-ready (see Deployment section below)

**Backend hardening (this is where marks were lost last time, so extra care was taken here):**
- Centralized error-handling middleware — one consistent JSON error shape across the whole API instead of scattered try/catch blocks
- express-validator on user input (comments, profile updates)
- Clerk webhook signature verification (svix) so nobody can spoof a fake user-sync event
- Self-healing auth: if a session comes in before the webhook has synced (race condition right after signup), the middleware pulls the profile from Clerk directly instead of 401-ing the user
- Helmet for HTTP security headers
- Ownership checks on delete routes (can't delete someone else's post/comment)
- Mongoose indexes on frequently-queried fields for fast lookups
- DNS-resilient MongoDB connection (see below) with retries and a clear error message instead of a silent hang/crash
- Graceful handling of unhandled promise rejections
- Health check endpoint (`GET /api/health`) for quick smoke testing

## About the MongoDB DNS issue from last time

`mongodb+srv://` connection strings (the default Atlas gives you) need a DNS
**SRV record lookup** to work. On some networks (college/hostel wifi, certain
routers) that lookup fails — which is what happened last time, and changing
your computer's system DNS settings isn't the right fix for it.

The actual fix: use the **non-SRV** `mongodb://` connection string instead
(Atlas → Connect → Drivers → pick an older driver version → it gives you a
plain `mongodb://host1,host2,host3/...` string with no DNS lookup involved).
`backend/.env.example` has the exact format and an example. `backend/config/db.js`
also now retries a few times and prints a clear message if it detects this
specific failure, instead of just crashing.

## Setup Instructions

### 1. Prerequisites
- Node.js 18+
- MongoDB (local install, or a free MongoDB Atlas cluster — see DNS note above)
- A free [Cloudinary](https://cloudinary.com) account (for image uploads)
- A free [Clerk](https://clerk.com) account (for authentication)

### 2. Clerk Setup
1. Create an app at [dashboard.clerk.com](https://dashboard.clerk.com)
2. Copy your **Publishable key** and **Secret key** from *API Keys*
3. Go to *Webhooks* → *Add Endpoint*:
   - URL: `<your-backend-url>/api/webhooks/clerk` (e.g. `http://localhost:5000/api/webhooks/clerk` — use a tool like `ngrok` if testing locally, since Clerk needs to reach it)
   - Subscribe to: `user.created`, `user.updated`, `user.deleted`
   - Copy the **Signing Secret**

### 3. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env and fill in: MONGO_URI, CLERK_SECRET_KEY, CLERK_WEBHOOK_SECRET, CLOUDINARY_* keys
npm run dev
```
Backend runs on `http://localhost:5000`. Test it: visit `http://localhost:5000/api/health`.

Optional — seed some demo data for your live demo (creates real Clerk users too, so you can actually log in as them):
```bash
npm run seed
```

### 4. Frontend Setup
```bash
cd frontend
npm install
cp .env.local.example .env.local
# Edit .env.local and fill in: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY
npm run dev
```
Frontend runs on `http://localhost:3000`.

### 5. Try it out
1. Go to `http://localhost:3000/signup` and create an account through Clerk's form
2. Click **Create** in the sidebar to upload your first post
3. Open the app in a second browser (or incognito window), sign in as a different user, and like/comment on the post — watch it update live on the first window without refreshing

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/auth/me` | Current user's synced profile |
| POST | `/api/webhooks/clerk` | Clerk → MongoDB user sync (called by Clerk, not the frontend) |
| GET | `/api/posts` | Paginated feed |
| POST | `/api/posts` | Create post (multipart, field: `image`) |
| GET | `/api/posts/:id` | Single post |
| DELETE | `/api/posts/:id` | Delete own post |
| PUT | `/api/posts/:id/like` | Toggle like |
| GET/POST | `/api/posts/:id/comments` | List / add comment |
| DELETE | `/api/comments/:id` | Delete own comment |
| GET | `/api/users/:username` | Public profile + posts |
| PUT | `/api/users/profile` | Edit profile |
| PUT | `/api/users/avatar` | Upload avatar (multipart, field: `avatar`) |
| PUT | `/api/users/:id/follow` | Toggle follow |
| PUT | `/api/users/save/:postId` | Toggle bookmark |
| GET | `/api/notifications` | Notifications list |

All private routes expect `Authorization: Bearer <clerk-session-token>` — the
frontend attaches this automatically (see `frontend/lib/api.js`).

## Deployment (quick options)
- **Backend**: Render, Railway, or Cyclic — set the same env vars from `.env.example`, plus set `CLIENT_URL` to your deployed frontend URL, and point the Clerk webhook at the deployed `/api/webhooks/clerk` URL.
- **Frontend**: Vercel — set the env vars from `.env.local.example` to your deployed backend URL and Clerk keys.
- **Database**: MongoDB Atlas free tier (use the non-SRV connection string — see DNS note above).

## Submission Checklist
1. Push both `backend/` and `frontend/` to a GitHub repo
2. Deploy backend + frontend (or run locally for the demo)
3. Record/prepare a live demo showing: signup → create post → like/comment (real-time) → profile edit → follow
4. Submit GitHub link + live demo link on the internship portal
