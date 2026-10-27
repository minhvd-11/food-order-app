// contexts/UserContext.tsx
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { User, UserMetadata } from "@supabase/supabase-js";

interface UserContextValue {
  user: User | null;
  userMetadata: UserMetadata | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userMetadata, setUserMetadata] = useState<UserMetadata | null>(null);
  const [loading, setLoading] = useState(true);

  // Lazy state keeps one client per provider, so the effect below runs once.
  const [supabase] = useState(() => createClient());

  const fetchUser = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.getUser();
    if (!error && data.user) {
      setUser(data.user);
      setUserMetadata(data.user.user_metadata ?? null);
    } else {
      setUser(null);
      setUserMetadata(null);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchUser();
    // Optional: listen to auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchUser();
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, [fetchUser, supabase]);

  return (
    <UserContext.Provider
      value={{ user, userMetadata, loading, refreshUser: fetchUser }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
}
