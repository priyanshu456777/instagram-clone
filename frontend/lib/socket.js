import { io } from "socket.io-client";

let socket;

// Singleton pattern — Next.js re-renders/hot-reloads shouldn't spawn multiple
// socket connections, which would cause duplicate real-time events.
export const getSocket = () => {
  if (!socket) {
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

    socket = io(SOCKET_URL, {
      autoConnect: true,
      transports: ["websocket", "polling"],
    });

    attachClerkToken(socket);
  }
  return socket;
};

// Grabs a Clerk session token asynchronously and upgrades the (already-open,
// anonymous) socket connection with it. Kept separate from `getSocket` so
// callers can keep using it synchronously exactly as before.
async function attachClerkToken(s) {
  if (typeof window === "undefined" || !window.Clerk?.session) return;
  try {
    const token = await window.Clerk.session.getToken();
    if (token) {
      s.auth = { token };
      s.disconnect();
      s.connect();
    }
  } catch (err) {
    // No active session — socket stays connected anonymously.
  }
}

export const reconnectSocketWithAuth = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  return getSocket();
};
