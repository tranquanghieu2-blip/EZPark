import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";


interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User, token: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Load dữ liệu khi app khởi động
  useEffect(() => {
    const loadAuth = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error("Error loading user", e);
      } finally {
        setLoading(false);
      }
    };
    loadAuth();
  }, []);

  // 🔹 Lưu thông tin user khi login
  const login = async (userData: User, token: string, refreshToken: string) => {
    try {
      await AsyncStorage.setItem("user", JSON.stringify(userData));
      await AsyncStorage.setItem("accessToken", token);
      await AsyncStorage.setItem("refreshToken", refreshToken);
      setUser(userData);
    } catch (e) {
      console.error("Error saving user:", e);
    }
  };

  // 🔹 Xóa thông tin khi logout
  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(["user", "accessToken", "refreshToken"]);
      setUser(null);
    } catch (e) {
      console.error("Error clearing storage:", e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
