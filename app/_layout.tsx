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
import { registerDevice } from '@/service/fcm/fcmService';
import { createNotificationChannel } from '@/service/fcm/notifications';
import notifee, { AndroidImportance } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import '../global.css';
import { ToastCustomView } from '@/components/ToastCustomView';
import { mapEvents, EVENT_USER_LOGIN } from '@/utils/eventEmitter';
import { useNavigation } from '@react-navigation/native';
import Colors from '@/constants/colors';
import { ConfirmedParkingProvider } from '@/app/context/ConfirmedParkingContext';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { user, loading, updateAccessToken } = useAuth();
  const navigation = useNavigation<any>();

  // Đăng ký callback cập nhật accessToken từ apiClient
  useEffect(() => {
    setAccessTokenUpdater(updateAccessToken);
  }, [updateAccessToken]);

  // Lắng nghe sự kiện đăng nhập để chuyển hướng
  useEffect(() => {
    const handler = () => {
      navigation.reset({
        index: 0,
        routes: [{ name: '(tabs)' }],
      });
    };

    mapEvents.addListener(EVENT_USER_LOGIN, handler);

    return () => {
      mapEvents.removeListener(EVENT_USER_LOGIN, handler);
    };
  }, [navigation]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color={Colors.primary} />
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
      <Stack.Screen name="(tabs)" component={_Layout} />
      <Stack.Screen name="auth" component={AuthLayout} />
    </Stack.Navigator>
  );
}

export default function RootLayout() {
  console.log('RootLayout rendered');
  // Khởi tạo notifications khi app start
  registerDevice();

  useEffect(() => {
    // Tạo channel khi app khởi động
    createNotificationChannel();

    // Lắng nghe thông báo khi app đang mở (foreground)
    const subscribe = messaging().onMessage(async remoteMessage => {
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

    return subscribe;
  }, []);
  return (
    <AuthProvider>
      {/* <NavigationContainer>
        <AppNavigator />
      </NavigationContainer> */}

      <ConfirmedParkingProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </ConfirmedParkingProvider>

      {/* ToastManager toàn cục */}
      <ToastManager
        config={{
          success: (props: any) => <ToastCustomView {...props} />,
          error: (props: any) => <ToastCustomView {...props} />,
          warning: (props: any) => <ToastCustomView {...props} />,
          info: (props: any) => <ToastCustomView {...props} />,
        }}
      />
    </AuthProvider>
  );
}
