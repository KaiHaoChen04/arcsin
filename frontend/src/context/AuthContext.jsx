import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setUser({ token });
    }
    setLoading(false);

    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error?.response?.status;
        const errorMessage = error?.response?.data?.error;
        if (status === 401 && errorMessage === "Token expired") {
          toast.info("Session expired. Please log in again.", {
            toastId: "session-expired",
          });
          logout();
        }
        return Promise.reject(error);
      },
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post("/auth/login", {
        username,
        password,
      });
      const { access_token } = response.data;
      localStorage.setItem("token", access_token);
      setUser({ token: access_token, username });
      toast.success("Logged in successfully", { toastId: "login-success" });
      return true;
    } catch (error) {
      console.error("Login failed", error);
      toast.error(error.response?.data?.error || "Login failed", {
        toastId: "login-failed",
      });
      return false;
    }
  };

  const register = async (username, password) => {
    try {
      await axios.post("/auth/register", {
        username,
        password,
      });
      toast.success("Registration successful! Please login.");
      return true;
    } catch (error) {
      console.error("Registration failed", error);
      toast.error(error.response?.data?.error || "Registration failed", {
        toastId: "registration-failed",
      });
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    toast.info("Logged out", { toastId: "logged-out" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
