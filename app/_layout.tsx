import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthLayout from '@/app/auth/_layout';
import _Layout from '@/app/(tabs)/_layout';
import '@/config/mapBoxConfig';
import { AuthProvider, useAuth } from '@/app/context/AuthContext';
import { setAccessTokenUpdater } from '@/service/apiClient';
import { View, ActivityIndicator } from 'react-native';
import ToastManager from 'toastify-react-native';
import { toastConfig } from '@/utils/CustomToast';
import { registerDevice } from '@/service/fcm/fcmService';
import { createNotificationChannel } from '@/service/fcm/notifications';
import notifee, { AndroidImportance } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import '../global.css';

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
  registerDevice();

  useEffect(() => {
    // 🔹 Tạo channel khi app khởi động
    createNotificationChannel();

    // 🔹 Lắng nghe thông báo khi app đang mở (foreground)
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      await notifee.displayNotification({
        title: remoteMessage.notification?.title,
        body: remoteMessage.notification?.body,
        android: {
          channelId: 'ezpark_notifications',
          showTimestamp: true,
          timestamp: new Date().getTime(),
          pressAction: { id: 'default' },
        },
      });
    });

    return unsubscribe;
  }, []);
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>

      {/* ToastManager toàn cục */}
      <ToastManager />
    </AuthProvider>
  );
}
