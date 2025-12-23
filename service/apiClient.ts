// src/api/apiClient.ts
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { API_CONFIG } from "@/config/apiConfig";

let updateAccessTokenCallback: ((token: string) => void) | null = null;

export const setAccessTokenUpdater = (callback: (token: string) => void) => {
  updateAccessTokenCallback = callback;
};

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: API_CONFIG.headers,
});

// Add accessToken vào mỗi request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = [];
};

// Refresh Token tự động khi 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = "Bearer " + token;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;
      try {
        const refreshToken = await AsyncStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");

        const res = await axios.post(
          `${API_CONFIG.BASE_URL}${API_CONFIG.endpoints.REFRESH_TOKEN}`,
          { refreshToken }
        );

        const newAccessToken = res.data.accessToken;
        await AsyncStorage.setItem("accessToken", newAccessToken);

        // Gọi hàm updateAccessToken trong AuthContext
        if (updateAccessTokenCallback) updateAccessTokenCallback(newAccessToken);

        api.defaults.headers.common["Authorization"] = "Bearer " + newAccessToken;
        processQueue(null, newAccessToken);

        originalRequest.headers["Authorization"] = "Bearer " + newAccessToken;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        await AsyncStorage.multiRemove(["accessToken", "refreshToken", "user"]);
        Alert.alert("Phiên đăng nhập hết hạn", "Vui lòng đăng nhập lại.");
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
