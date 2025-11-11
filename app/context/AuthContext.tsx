import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ToastCustom from "@/utils/CustomToast";
import { EVENT_USER_LOGIN, EVENT_USER_LOGOUT, mapEvents } from "@/utils/eventEmitter";


interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  login: (userData: User|null, token: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  updateAccessToken: (token: string) => Promise<void>;
  updateUser: (updatedUser: User) => Promise<void>; 
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  accessToken: null,
  refreshToken: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  updateAccessToken: async () => {},
  updateUser: async () => {}, 
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load dữ liệu khi app khởi động
  useEffect(() => {
    const loadAuth = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        const storedAccessToken = await AsyncStorage.getItem("accessToken");
        const storedRefreshToken = await AsyncStorage.getItem("refreshToken");

        if (storedUser) setUser(JSON.parse(storedUser));
        if (storedAccessToken) setAccessToken(storedAccessToken);
        if (storedRefreshToken) setRefreshToken(storedRefreshToken);
      } catch (e) {
        console.error("Error loading user", e);
      } finally {
        setLoading(false);
      }
    };
    loadAuth();
  }, []);

  const login = async (userData: User | null, token: string, refresh: string) => {
  try {
    if (userData) {
      await AsyncStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
    }

    await AsyncStorage.multiSet([
      ["accessToken", token],
      ["refreshToken", refresh],
    ]);
    setAccessToken(token);
    setRefreshToken(refresh);
    mapEvents.emit(EVENT_USER_LOGIN);
  } catch (e) {
    console.error("Error saving user:", e);
  }
};


  // Logout: Xóa toàn bộ dữ liệu
  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(["user", "accessToken", "refreshToken"]);
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      mapEvents.emit(EVENT_USER_LOGOUT);
      ToastCustom.success('Đăng xuất thành công!', 'Bạn đã đăng xuất khỏi EZPark.');
    } catch (e) {
      console.error("Error clearing storage:", e);
    }
  };

  // Khi refresh token thành công → cập nhật lại accessToken
  const updateAccessToken = async (token: string) => {
    try {
      await AsyncStorage.setItem("accessToken", token);
      setAccessToken(token);
    } catch (e) {
      console.error("Error updating access token:", e);
    }
  };

  // Cập nhật thông tin user
  const updateUser = async (updatedUser: User) => {
    try {
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
    catch (e) {
      console.error("Error updating user:", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, accessToken, refreshToken, loading, login, logout, updateAccessToken, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
