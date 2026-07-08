import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/router";
import api from "../lib/api";
import { reconnectSocketWithAuth } from "../lib/socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { isLoaded: clerkLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
      reconnectSocketWithAuth();
      return data.user;
    } catch (err) {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!clerkLoaded) return;
    if (!isSignedIn) {
      setUser(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchMe().finally(() => setLoading(false));
  }, [clerkLoaded, isSignedIn, fetchMe]);

  const logout = async () => {
    await signOut();
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout, refresh: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);