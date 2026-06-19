import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@workspace/api-client-react";
import { setAuthTokenGetter } from "@workspace/api-client-react/custom-fetch";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("food_token");
      const storedUser = localStorage.getItem("food_user");
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Failed to restore auth state", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update token getter whenever token changes
  useEffect(() => {
    setAuthTokenGetter(() => {
      const t = localStorage.getItem("food_token");
      return t;
    });
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("food_token", newToken);
    localStorage.setItem("food_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("food_token");
    localStorage.removeItem("food_user");
    setToken(null);
    setUser(null);
  };

  if (isLoading) {
    return null; // Or a proper full-screen loader
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
