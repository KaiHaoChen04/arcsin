import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Decode token to get user info if needed, or just assume logged in for now.
      // Ideally calls a /me endpoint or decodes JWT.
      // For simplicity/security, we'll just check if token exists.
      // We can also decode the JWT manually if we want user details immediately.
      setUser({ token }); 
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post('/auth/login', {
        username,
        password,
      });
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      setUser({ token: access_token, username });
      toast.success("Logged in successfully");
      return true;
    } 
    catch (error) {
      console.error("Login failed", error);
      toast.error(error.response?.data?.error || "Login failed");
      return false;
    }
  };

  const register = async (username, password) => {
    try {
      await axios.post('/auth/register', {
        username,
        password,
      });
      toast.success("Registration successful! Please login.");
      return true;
    } 
    catch (error) {
      console.error("Registration failed", error);
      toast.error(error.response?.data?.error || "Registration failed");
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast.info("Logged out");
  };

  if (loading) {
      return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
