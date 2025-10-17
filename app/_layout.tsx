import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AuthLayout from "@/app/auth/_layout";
import _Layout from "@/app/(tabs)/_layout";
import "@/config/mapBoxConfig";
import { AuthProvider, useAuth } from "@/app/context/AuthContext";
import { setAccessTokenUpdater } from "@/service/apiClient";
import { View, ActivityIndicator } from "react-native";
import  ToastManager  from "toastify-react-native";
import { toastConfig } from "@/utils/CustomToast";
import { registerDevice } from '@/service/fcm/fcmService';
import { setupNotificationListener } from '@/service/fcm/notifications';

import "../global.css";

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { user, loading, updateAccessToken } = useAuth();

  // Đăng ký callback cập nhật accessToken từ apiClient
  useEffect(() => {
    setAccessTokenUpdater(updateAccessToken);
  }, [updateAccessToken]);

  if (loading) {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#FF6F00" />
    </View>
  );
}


  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, // Tắt vuốt ngang
      }}
    >
      {user ? (
        // 🔹 Nếu đã đăng nhập -> vào màn hình chính
        <Stack.Screen name="(tabs)" component={_Layout} />
      ) : (
        // 🔹 Nếu chưa đăng nhập -> vào auth layout
        <Stack.Screen name="auth" component={AuthLayout} />
      )}
    </Stack.Navigator>
  );
}


export default function RootLayout() {
   console.log('RootLayout rendered');
  // Khởi tạo notifications khi app start
  useEffect(() => {
    const initNotifications = async () => {
      try {
        await registerDevice();
        setupNotificationListener();
        console.log('Notifications initialized successfully');
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };

    initNotifications();
  }, []);
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>

      {/* ToastManager toàn cục */}
      <ToastManager
        
      />
    </AuthProvider>
    
  );
}
