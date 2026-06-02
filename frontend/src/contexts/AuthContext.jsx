import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch('http://localhost:4000/auth/me', {
          headers: { 'x-auth-token': token }
        });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else {
          setToken(null);
          localStorage.removeItem('token');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token]);

  const login = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const updatePoints = (newPoints) => {
    setUser(prev => ({ ...prev, points: newPoints }));
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, updatePoints, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
