import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import authApi from "../api/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Synchronize state with localStorage
  const persistSession = useCallback((newToken, newUser) => {
    if (newToken) {
      localStorage.setItem("token", newToken);
      setToken(newToken);
    } else {
      localStorage.removeItem("token");
      setToken(null);
    }

    if (newUser) {
      localStorage.setItem("user", JSON.stringify(newUser));
      setUser(newUser);
    } else {
      localStorage.removeItem("user");
      setUser(null);
    }
  }, []);

  // Fetch current user from /api/auth/me to verify token validity
  const refreshUser = useCallback(async () => {
    const activeToken = localStorage.getItem("token");
    if (!activeToken) {
      persistSession(null, null);
      setLoading(false);
      return null;
    }

    try {
      const response = await authApi.getMe();
      if (response && response.user) {
        persistSession(activeToken, response.user);
        return response.user;
      }
    } catch (error) {
      console.warn("Session verification failed, logging out:", error);
      persistSession(null, null);
    } finally {
      setLoading(false);
    }
    return null;
  }, [persistSession]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Login handler
  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await authApi.login({ email, password });
      persistSession(data.token, data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  // Register patient handler
  const register = async (payload) => {
    setLoading(true);
    try {
      const data = await authApi.register(payload);
      persistSession(data.token, data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn("Logout API notification failed:", err);
    } finally {
      persistSession(null, null);
    }
  };

  // Update profile demographics
  const updateProfile = async (formData) => {
    const data = await authApi.updateProfile(formData);
    if (data.user) {
      persistSession(token, data.user);
    }
    return data;
  };

  // Change password
  const changePassword = async (passwords) => {
    return await authApi.changePassword(passwords);
  };

  // Upload avatar
  const uploadAvatar = async (file) => {
    const data = await authApi.uploadAvatar(file);
    if (data.user) {
      persistSession(token, data.user);
    }
    return data;
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(token && user),
    role: user?.role || null,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    uploadAvatar,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
