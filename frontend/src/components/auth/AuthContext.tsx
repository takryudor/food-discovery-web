"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { setAuthTokenResolver } from "@/lib/api/client";
import { changeUserPassword, updateUserProfile, uploadAvatar } from "@/lib/auth/profile";
import { supabase } from "@/lib/supabase";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>;
  logout: () => Promise<void>;
  updateProfile: (input: { name: string; avatarFile?: File | null }) => Promise<void>;
  updatePassword: (input: {
    currentPassword: string;
    newPassword: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapSupabaseUser(supabaseUser: SupabaseUser): User {
  const email = supabaseUser.email ?? "";
  const metadata = supabaseUser.user_metadata as Record<string, unknown> | undefined;
  const displayName =
    (typeof metadata?.full_name === "string" && metadata.full_name) ||
    (typeof metadata?.name === "string" && metadata.name) ||
    email.split("@")[0] ||
    "User";

  const avatarUrl =
    typeof metadata?.avatar_url === "string" ? metadata.avatar_url : undefined;

  return {
    id: supabaseUser.id,
    name: displayName,
    email,
    avatar:
      avatarUrl ??
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const accessTokenRef = useRef<string | null>(null);

  useEffect(() => {
    setAuthTokenResolver(() => accessTokenRef.current);

    const applySession = (session: { access_token: string; user: SupabaseUser } | null) => {
      accessTokenRef.current = session?.access_token ?? null;
      setUser(session?.user ? mapSupabaseUser(session.user) : null);
      setIsLoading(false);
    };

    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error("[auth] getSession failed:", error.message);
        applySession(null);
        return;
      }
      applySession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return { needsEmailConfirmation: !data.session };
  }, []);

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    accessTokenRef.current = null;
  }, []);

  const updateProfile = useCallback(
    async (input: { name: string; avatarFile?: File | null }) => {
      if (!user) throw new Error("Not authenticated");

      let avatarUrl: string | undefined;
      if (input.avatarFile) {
        avatarUrl = await uploadAvatar(user.id, input.avatarFile);
      }

      await updateUserProfile({
        name: input.name,
        ...(avatarUrl ? { avatarUrl } : {}),
      });

      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (data.user) setUser(mapSupabaseUser(data.user));
    },
    [user],
  );

  const updatePassword = useCallback(
    async (input: { currentPassword: string; newPassword: string }) => {
      if (!user?.email) throw new Error("Not authenticated");
      await changeUserPassword(user.email, input.currentPassword, input.newPassword);
    },
    [user],
  );

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      updateProfile,
      updatePassword,
    }),
    [user, isLoading, login, register, logout, updateProfile, updatePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
