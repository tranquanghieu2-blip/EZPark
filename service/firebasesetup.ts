import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';


// export async function requestNotificationPermission() {
//   const authStatus = await messaging().requestPermission();
//   const enabled =
//     authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
//     authStatus === messaging.AuthorizationStatus.PROVISIONAL;
//   console.log('Notification permission:', enabled);
//   return enabled;
// }

export async function getFcmToken() {
  try {
    const token = await messaging().getToken();
    // console.log('FCM Token:', token);
    return token;
  } catch (e) {
    console.error('Get FCM token failed', e);
    return null;
  }
}


// export function registerForegroundHandler() {
//   messaging().onMessage(async remoteMessage => {
//     console.log('Received foreground FCM:', remoteMessage);
//     // Hiển thị thông báo bằng Notifee (vì FCM foreground không tự hiện)
//     await notifee.displayNotification({
//       title: remoteMessage.notification?.title ?? 'EZPark',
//       body: remoteMessage.notification?.body ?? 'Thông báo mới',
//       android: { channelId: 'parking-notifications' },
//     });
//   });
// }


// export function registerBackgroundHandler() {
//   messaging().setBackgroundMessageHandler(async remoteMessage => {
//     console.log('Received background FCM:', remoteMessage);
//     await notifee.displayNotification({
//       title: remoteMessage.notification?.title ?? 'EZPark',
//       body: remoteMessage.notification?.body ?? 'Thông báo nền đã nhận.',
//       android: { channelId: 'parking-notifications' },
//     });
//   });
// }

