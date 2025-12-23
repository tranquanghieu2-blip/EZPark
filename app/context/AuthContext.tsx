import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ToastCustom from "@/utils/CustomToast";
import { EVENT_USER_LOGIN, EVENT_USER_LOGOUT, mapEvents } from "@/utils/eventEmitter";


interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  sessionID: string | null;
  loading: boolean;
  login: (userData: User|null, token: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  updateAccessToken: (token: string) => Promise<void>;
  updateUser: (updatedUser: User) => Promise<void>; 
  updateSessionID: (sessionID: string | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  accessToken: null,
  refreshToken: null,
  sessionID: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  updateAccessToken: async () => {},
  updateUser: async () => {}, 
  updateSessionID: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [sessionID, setSessionID] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  

  // Load dữ liệu khi app khởi động
  useEffect(() => {
    const loadAuth = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        const storedAccessToken = await AsyncStorage.getItem("accessToken");
        const storedRefreshToken = await AsyncStorage.getItem("refreshToken");
        const storedSessionID = await AsyncStorage.getItem("sessionID");

        if (storedUser) setUser(JSON.parse(storedUser));
        if (storedAccessToken) setAccessToken(storedAccessToken);
        if (storedRefreshToken) setRefreshToken(storedRefreshToken);
        if (storedSessionID) setSessionID(storedSessionID);
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

    await AsyncStorage.removeItem("sessionID");
    setAccessToken(token);
    setRefreshToken(refresh);
    setSessionID(null);
    mapEvents.emit(EVENT_USER_LOGIN);
  } catch (e) {
    console.error("Error saving user:", e);
  }
};


  // Logout: Xóa toàn bộ dữ liệu
  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(["user", "accessToken", "refreshToken", "sessionID"]);
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      setSessionID(null);
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

  // Cập nhật sessionID
  const updateSessionID = async (newSessionID: string | null) => {
    try {
      if (newSessionID) {
        await AsyncStorage.setItem("sessionID", newSessionID);
      } else {
        await AsyncStorage.removeItem("sessionID");
      }
      setSessionID(newSessionID);
    } catch (e) {
      console.error("Error updating session ID:", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, accessToken, refreshToken, sessionID, loading, login, logout, updateAccessToken, updateUser, updateSessionID }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
