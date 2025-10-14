// RootLayout.tsx
import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AuthLayout from "@/app/auth/_layout";
import _Layout from "@/app/(tabs)/_layout";
import "@/config/mapBoxConfig";
import { AuthProvider, useAuth } from "@/app/context/AuthContext";
import { setAccessTokenUpdater } from "@/service/apiClient";
import { View, ActivityIndicator } from "react-native";

import "../global.css";

const Stack = createNativeStackNavigator();

// ============================
// Màn hình điều hướng chính
// ============================
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

// ============================
// Root App Wrapper
// ============================
export default function RootLayout() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
