// import messaging from "@react-native-firebase/messaging";

// export async function getFcmToken() {
//   const token = await messaging().getToken();
//   console.log("FCM token:", token);
//   return token;
// }

// messaging().setBackgroundMessageHandler(async msg => {
//   console.log("Message received in background:", msg);
// });
// src/service/firebaseSetup.ts

// Nếu bạn chưa cài đặt, chạy:
// yarn add @react-native-firebase/app @react-native-firebase/messaging

import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';

/**
 * Yêu cầu quyền thông báo (Android tự cho phép, iOS cần hỏi)
 */
export async function requestNotificationPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  console.log('Notification permission:', enabled);
  return enabled;
}

/**
 * Lấy token thiết bị (gửi lên server nếu cần)
 */
export async function getFcmToken() {
  try {
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    return token;
  } catch (e) {
    console.error('Get FCM token failed', e);
    return null;
  }
}

/**
 * Đăng ký handler nhận tin nhắn khi app đang mở (foreground)
 */
export function registerForegroundHandler() {
  messaging().onMessage(async remoteMessage => {
    console.log('Received foreground FCM:', remoteMessage);
    // Hiển thị thông báo bằng Notifee (vì FCM foreground không tự hiện)
    await notifee.displayNotification({
      title: remoteMessage.notification?.title ?? 'EZPark',
      body: remoteMessage.notification?.body ?? 'Thông báo mới',
      android: { channelId: 'parking-notifications' },
    });
  });
}

/**
 * Đăng ký handler cho background/killed app
 * => React Native sẽ chạy function này trong “headless” mode
 */
export function registerBackgroundHandler() {
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Received background FCM:', remoteMessage);
    await notifee.displayNotification({
      title: remoteMessage.notification?.title ?? 'EZPark',
      body: remoteMessage.notification?.body ?? 'Thông báo nền đã nhận.',
      android: { channelId: 'parking-notifications' },
    });
  });
}

