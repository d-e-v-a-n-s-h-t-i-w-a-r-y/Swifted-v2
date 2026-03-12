import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";
import type { UserProfile } from "@/types/content";

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  needsName: boolean;
}

interface AuthContextType extends AuthState {
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  setDisplayName: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STARTUP_SHOWN_KEY = "swifted-startup-shown";

// Convert Supabase User to our UserProfile format
function mapUserToProfile(user: User, metadata?: any): UserProfile {
  return {
    id: user.id,
    email: user.email || "",
    name: metadata?.display_name || user.user_metadata?.full_name || "",
    avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    needsName: false,
  });

  // Initialize auth state and listen for changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSessionChange(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSessionChange(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSessionChange = (session: Session | null) => {
    if (session?.user) {
      const userProfile = mapUserToProfile(session.user);
      setState({
        user: userProfile,
        isAuthenticated: true,
        isLoading: false,
        needsName: !userProfile.name,
      });
    } else {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        needsName: false,
      });
    }
  };

  const loginWithGoogle = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error("Login error:", error);
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const setDisplayName = useCallback(async (name: string) => {
    if (!state.user) return;

    const { error } = await supabase.auth.updateUser({
      data: { display_name: name },
    });

    if (error) {
      console.error("Error updating display name:", error);
      throw error;
    }

    // Update local state
    setState(prev => {
      if (!prev.user) return prev;
      return {
        ...prev,
        user: { ...prev.user, name },
        needsName: false,
      };
    });
  }, [state.user]);

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      throw error;
    }

    localStorage.removeItem(STARTUP_SHOWN_KEY);
    
    // Force a hard reload on logout to completely flush all React state 
    // (useStats, useStreaks, Roadmaps) from memory. We skip setting `user: null`
    // here because React would synchronously re-render the components as a "guest"
    // before the reload hits, accidentally saving User A's data as guest data!
    window.location.reload();
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, loginWithGoogle, logout, setDisplayName }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
