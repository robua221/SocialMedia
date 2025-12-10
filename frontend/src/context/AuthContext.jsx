import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem("token") || "");

  // Persist user in localStorage
  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  // Persist token in localStorage
  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  const login = (userData, jwt) => {
    const normalized = {
      ...userData,
      _id: userData._id || userData.id,
    };

    setUser(normalized);
    setToken(jwt);
  };

  const logout = () => {
    setUser(null);
    setToken("");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to access auth context easily
export const useAuth = () => useContext(AuthContext);

// Global helper: Always include Bearer token correctly
export const authHeader = () => {
  const token = localStorage.getItem("token");
  return {
    Authorization: token ? "Bearer " + token : "",
  };
};
