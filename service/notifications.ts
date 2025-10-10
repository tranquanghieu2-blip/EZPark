// import PushNotification from 'react-native-push-notification';

// // Khởi tạo notification
// PushNotification.configure({
//   onRegister: function(token) {
//     console.log('TOKEN:', token);
//   },
//   onNotification: function(notification) {
//     console.log('NOTIFICATION:', notification);
//   },
//   permissions: {
//     alert: true,
//     badge: true,
//     sound: true,
//   },
//   popInitialNotification: true,
//   requestPermissions: true,
// });

// export const scheduleNotificationAtDate = async (
//   title: string,
//   body: string,
//   date: Date
// ): Promise<string> => {
//   const id = Math.floor(Math.random() * 1000000).toString();
  
//   PushNotification.localNotificationSchedule({
//     id: id,
//     title: title,
//     message: body, 
//     date: date,
//     allowWhileIdle: true,
//     channelId: 'parking-notifications',
//   });

//   return id;
// };

// // Tạo channel cho Android
// PushNotification.createChannel(
//   {
//     channelId: 'parking-notifications',
//     channelName: 'Parking Notifications',
//     channelDescription: 'Notifications for parking spots',
//     soundName: 'default',
//     importance: 4,
//     vibrate: true,
//   },
//   (created) => console.log(`CreateChannel returned '${created}'`)
// );