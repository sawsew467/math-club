"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Profile, UserRole } from "@/types/supabase";

interface TeacherProfile {
  email: string;
  name: string;
  role: "teacher";
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  teacherProfile: TeacherProfile | null;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
    grade?: number
  ) => Promise<{ error: Error | null }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: Error | null; isTeacher?: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);

  const supabase = createClient();

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }

    return data as Profile;
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  useEffect(() => {
    // Check for teacher session in localStorage
    const checkTeacherSession = () => {
      const savedTeacher = localStorage.getItem("teacherAuth");
      if (savedTeacher) {
        try {
          const teacher = JSON.parse(savedTeacher) as TeacherProfile;
          setTeacherProfile(teacher);
        } catch {
          localStorage.removeItem("teacherAuth");
        }
      }
    };

    // Get initial session
    const initializeAuth = async () => {
      checkTeacherSession();

      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession();

      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      if (initialSession?.user) {
        const profileData = await fetchProfile(initialSession.user.id);
        setProfile(profileData);
      }

      setIsLoading(false);
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        const profileData = await fetchProfile(newSession.user.id);
        setProfile(profileData);
      } else {
        setProfile(null);
      }

      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
    grade?: number
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
          grade: grade,
        },
      },
    });

    // If signup successful and session exists (email confirmation disabled)
    if (!error && data.session && data.user) {
      setSession(data.session);
      setUser(data.user);
      // Fetch profile after a short delay to ensure trigger has completed
      setTimeout(async () => {
        const profileData = await fetchProfile(data.user!.id);
        setProfile(profileData);
      }, 500);
    }

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    // First, try teacher login
    try {
      const response = await fetch("/api/auth/teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.teacher) {
          // Save teacher session
          localStorage.setItem("teacherAuth", JSON.stringify(data.teacher));
          setTeacherProfile(data.teacher);
          return { error: null, isTeacher: true };
        }
      }
    } catch {
      // Continue to student login if teacher login fails
    }

    // Try student login with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // If signin successful, update state immediately
    if (!error && data.session && data.user) {
      setSession(data.session);
      setUser(data.user);
      const profileData = await fetchProfile(data.user.id);
      setProfile(profileData);
    }

    return { error: error as Error | null, isTeacher: false };
  };

  const signOut = async () => {
    // Clear teacher session
    localStorage.removeItem("teacherAuth");
    setTeacherProfile(null);

    // Clear student session
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const value = {
    user,
    profile,
    session,
    isLoading,
    isTeacher: !!teacherProfile,
    isStudent: !!profile && profile.role === "student",
    teacherProfile,
    signUp,
    signIn,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
