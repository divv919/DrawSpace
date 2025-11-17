"use client";
// import { BACKEND_BASE_URL } from "@/config/variables";
// import { BACKEND_BASE_URL } from "@/config/variables";
import { SigninResponse, SignupResponse, User } from "@/types/auth";
import { createContext, useEffect, useState, useContext } from "react";

const BACKEND_BASE_URL = "http://localhost:3002";
export const AuthContext = createContext<{
  signup: ({
    email,
    password,
    username,
  }: {
    email: string;
    password: string;
    username: string;
  }) => Promise<SignupResponse>;
  signin: ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => Promise<SigninResponse>;
  populateUser: (user: User) => Promise<void>;
  user: User | null;
  isAuthenticated: boolean;
  logout: () => void;
}>({
  signup: async () => {
    return new Promise(() => null);
  },
  signin: async () => {
    return new Promise(() => null);
  },
  populateUser: async () => {},
  user: null,
  isAuthenticated: false,
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const populateUser = async (user: User) => {
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      populateUser(JSON.parse(storedUser));
    }
  }, []);

  const signup = async ({
    email,
    password,
    username,
  }: {
    email: string;
    password: string;
    username: string;
  }) => {
    console.log("signup running");
    const response = await fetch(`${BACKEND_BASE_URL}/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, password, username }),
    });
    if (!response.ok) {
      throw new Error((await response.json()).message);
    }

    return response.json();
  };

  const signin = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    const response = await fetch(`${BACKEND_BASE_URL}/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      throw new Error((await response.json()).message);
    }
    return response.json();
  };

  const logout = () => {
    // Remove cookie by setting it to expire
    document.cookie =
      "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    localStorage.removeItem("user");
    setUser(null);
  };

  // Helper to check if auth token exists in cookies
  const getAuthToken = () => {
    if (typeof document === "undefined") return null;
    const cookies = document.cookie.split(";");
    const authCookie = cookies.find((cookie) =>
      cookie.trim().startsWith("authToken=")
    );
    return authCookie ? authCookie.split("=")[1] : null;
  };

  return (
    <AuthContext.Provider
      value={{
        signup,
        signin,
        populateUser,
        isAuthenticated: !!getAuthToken() && !!user,
        user,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
