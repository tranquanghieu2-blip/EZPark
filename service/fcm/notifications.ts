import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';

// export const setupNotificationListener = () => {
//   // Khi app đang foreground
//   messaging().onMessage(async remoteMessage => {
//     await notifee.displayNotification({
//       title: remoteMessage.notification?.title,
//       body: remoteMessage.notification?.body,
//       android: {
//         channelId: 'default',
//         showTimestamp: true,
//         importance: AndroidImportance.HIGH,
//       },
//     });
//   });
// };


export const createNotificationChannel = async () => {
  // Tạo kênh thông báo cho Android
  await notifee.createChannel({
    id: 'ezpark_notifications', // phải trùng với channelId bên server
    name: 'EZPark Notifications',
    importance: AndroidImportance.HIGH,
    sound: 'default',
  });
};
