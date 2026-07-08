# 📸 InstaClone — Full-Stack Instagram Clone

A feature-rich, full-stack Instagram clone built with the MERN stack, Clerk authentication, Cloudinary image storage, and real-time Socket.io updates.

![InstaClone Banner](https://via.placeholder.com/1200x400/121212/FFFFFF?text=InstaClone+%F0%9F%93%B8)

## ✨ Features

### 🔐 Authentication
- Email / social login powered by [Clerk](https://clerk.com)
- Self-healing auth — if the Clerk webhook hasn't synced yet, the middleware pulls the profile directly from Clerk
- Protected routes for posting, following, messaging, etc.

### 📰 Feed
- **For You** / **Following** toggle (matches real Instagram's tabbed feed)
- Infinite scroll with `IntersectionObserver`
- Skeleton loaders while content loads (smooth, premium feel)

### 📷 Posts
- Single-image posts
- **Carousel / multi-image posts** — up to 10 images per post (swipeable, with dots indicator, image counter, and arrow buttons)
- **Hashtags** — auto-parsed from caption, clickable, with dedicated `/explore?tag=foo` page
- **Mentions** — tag other users with `@username`, they get a notification
- **Location** tag (optional)
- Likes with optimistic UI (instant feedback, rollback on error)
- Comments (with replies — see [Comments 2.0](#comments-20))
- Save / bookmark posts
- Share button (placeholder for future sharing flow)
- Real-time like count updates via Socket.io

### 📖 Stories
- 24-hour auto-expiring stories (MongoDB TTL index — no cron job needed)
- Story viewer with image transitions
- See who viewed your story
- Story replies (snapshot preserved even after original expires)
- Story reactions

### 💬 Direct Messages
- One-on-one conversations
- Real-time message delivery
- Reply to stories from DMs
- Read receipts

### 🔔 Notifications
- Real-time notifications for likes, comments, follows, mentions, story interactions
- Unread indicator

### 👥 Social
- Follow / unfollow users
- Profile pages with post grid, follower / following counts
- User search
- Suggested users

### 🎨 UI / UX
- Polished skeleton loaders
- Error boundaries (no full-app crashes)
- Smooth animations (heart-burst, like-button bounce, image fade)
- Double-tap to like on mobile
- Hover effects on desktop
- Dark theme
- Responsive (mobile + desktop)

### 🛡️ Security
- Helmet for HTTP security headers
- CORS configured per environment
- Clerk handles all password / credential concerns
- Multer file-type + size validation
- `.env.example` provided — actual `.env` ignored via `.gitignore`
- Webhook signature verification with svix (raw body before JSON parsing)

## 🛠️ Tech Stack

**Frontend** — `frontend/`
- [Next.js 15](https://nextjs.org) (Pages Router)
- React 18
- Tailwind CSS 3
- Clerk Next.js SDK
- Axios
- Socket.io Client
- react-hot-toast
- lucide-react (icons)

**Backend** — `backend/`
- Node.js (>=18) + Express 4
- MongoDB + Mongoose 8
- Clerk Backend SDK + Svix (webhooks)
- Cloudinary (image storage)
- Multer (in-memory uploads, no temp files)
- Socket.io (real-time)
- Helmet, CORS, Morgan, express-validator, express-async-handler

## 📁 Project Structure

```
instagram-clone/
├── frontend/                # Next.js app
│   ├── components/
│   │   ├── Layout/          # Sidebar, MobileNav, Layout
│   │   ├── Post/            # PostCard, CreatePostModal, CommentSection, PostCarousel
│   │   ├── Profile/         # Profile components
│   │   ├── Story/           # StoryBar, StoryViewer
│   │   └── UI/              # Avatar, Spinner, Skeletons, ErrorBoundary
│   ├── context/             # AuthContext
│   ├── lib/                 # api.js (axios), socket.js, textParse.js
│   ├── pages/               # Next.js routes
│   │   ├── index.js         # Home feed
│   │   ├── explore.js       # Explore + hashtag search
│   │   ├── search.js        # User search
│   │   ├── notifications.js # Notifications feed
│   │   ├── saved.js         # Saved posts
│   │   ├── profile/         # User profile pages
│   │   ├── messages/        # DM pages
│   │   ├── login/           # Clerk login
│   │   └── signup/          # Clerk signup
│   └── styles/              # globals.css (Tailwind + shimmer animation)
└── backend/                 # Express API
    ├── config/              # db.js (mongo connection with retry)
    ├── controllers/         # postController, userController, storyController, etc.
    ├── middleware/          # auth, upload, validators, error
    ├── models/              # Mongoose schemas
    ├── routes/              # Express routers
    ├── utils/               # cloudinaryUpload, clerkSync, seed
    └── server.js            # Entry — Express + Socket.io + Clerk
```

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- MongoDB Atlas account (free tier is fine) **or** local MongoDB
- Clerk account (free tier)
- Cloudinary account (free tier)

### 1. Clone & install
```bash
git clone https://github.com/priyanshu456777/instagram-clone.git
cd instagram-clone

cd backend && npm install
cd ../frontend && npm install
```

### 2. Set up environment variables

**`backend/.env`** (copy from `.env.example`):
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
MONGO_URI=mongodb://127.0.0.1:27017/instaclone
CLERK_SECRET_KEY=sk_test_xxx
CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

**`frontend/.env.local`** (copy from `.env.local.example`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
```

### 3. Set up Clerk webhooks (so user.created / user.updated events sync profiles to MongoDB)
1. Clerk dashboard → Webhooks → Add Endpoint
2. URL: `http://localhost:5000/api/webhooks/clerk` (use ngrok / similar in dev)
3. Subscribe to: `user.created`, `user.updated`, `user.deleted`
4. Copy the signing secret into `CLERK_WEBHOOK_SECRET`

### 4. Run
```bash
# Terminal 1 — backend
cd backend
npm run dev          # nodemon, hot-reload

# Terminal 2 — frontend
cd frontend
npm run dev          # next dev
```

App: http://localhost:3000
API: http://localhost:5000/api

### 5. Seed demo data (optional)
```bash
cd backend
npm run seed
```
Creates a few demo users + posts so the feed isn't empty on first run.

## 🌐 Deployment

- **Frontend** → [Vercel](https://vercel.com) (one-click Next.js deploy)
- **Backend** → [Render](https://render.com) or [Railway](https://railway.app) (Node.js + persistent storage)
- **Database** → MongoDB Atlas (free M0 cluster)
- **Images** → Cloudinary (free tier gives 25GB)

Both services have free tiers that are enough for a portfolio / internship project.

## 📡 API Endpoints (summary)

### Auth
- `POST /api/webhooks/clerk` — Clerk webhook (Svix-verified)

### Users
- `GET  /api/auth/me` — current user
- `GET  /api/users/search/:query` — search users
- `GET  /api/users/:username` — profile
- `PUT  /api/users/profile` — update profile
- `PUT  /api/users/avatar` — update avatar (multipart)
- `PUT  /api/users/:id/follow` — toggle follow
- `PUT  /api/users/save/:postId` — toggle save
- `GET  /api/users/saved` — saved posts

### Posts
- `GET  /api/posts?page=&limit=&type=forYou|following` — feed
- `POST /api/posts` — create post (multipart, up to 10 images)
- `GET  /api/posts/hashtag/:tag` — posts by hashtag
- `GET  /api/posts/user/:userId` — user's posts
- `GET  /api/posts/:id` — single post
- `DELETE /api/posts/:id` — delete post (owner only)
- `PUT  /api/posts/:id/like` — toggle like

### Comments
- `GET  /api/posts/:id/comments` — list comments
- `POST /api/posts/:id/comments` — add comment

### Stories
- `GET  /api/stories` — active stories (24h)
- `POST /api/stories` — create story (multipart)
- `POST /api/stories/:id/view` — mark viewed
- `POST /api/stories/:id/like` — like story
- `GET  /api/stories/:id/seen-by` — viewers

### Messages
- `GET  /api/messages/conversations` — my conversations
- `GET  /api/messages/conversations/:id` — messages in conversation
- `POST /api/messages/send` — send message
- `POST /api/messages/story-reply` — reply to a story

### Notifications
- `GET  /api/notifications` — my notifications

## 🧪 Tech highlights worth talking about

1. **Self-healing auth** — `authMiddleware.js` resolves Clerk session → Mongo user. If webhook hasn't fired yet (race condition on signup), it falls back to pulling from Clerk directly.

2. **MongoDB TTL index on Stories** — `Story.expiresAt` is automatically deleted by Mongo 24h after creation. No cron job needed.

3. **Webhooks before JSON parser** — Clerk webhooks are mounted before `express.json()` because Svix needs to verify the signature against the *exact raw bytes* Clerk sent, not a re-serialized JSON object.

4. **In-memory Multer + Cloudinary streaming** — no temp files on disk. Critical for serverless / ephemeral environments like Render free tier.

5. **Optimistic UI on likes** — the heart flips immediately, the count updates, and rolls back only if the server disagrees. Makes the app feel native-app snappy.

6. **Hashtags & mentions pre-parsed at write time** — `Post.hashtags` is an indexed array, so `/api/posts/hashtag/:tag` is a single indexed query instead of a regex scan of every caption.

7. **Socket.io with Clerk auth** — the same Bearer token used for REST is reused on socket connect. Clients join their own user room, so `io.to(userId).emit(...)` can push notifications directly to the right tab.

## 📝 License

MIT — feel free to fork, learn from, and extend.

## 🙏 Acknowledgements

- Built as an internship project over [time period]
- Stack chosen for production-readiness: Clerk, Cloudinary, Socket.io, MongoDB
- UI patterns modeled on real Instagram to push polish to portfolio level