import notifee, { AndroidImportance, TimestampTrigger, TriggerType } from '@notifee/react-native';

// Hàm khởi tạo kênh (Android)
async function createChannel() {
  return await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
    importance: AndroidImportance.HIGH,
  });
}

// Hàm gửi thông báo lặp lại mỗi 10s
export async function startRepeatingNotification() {
  // Xin quyền thông báo (Android 13+)
  await notifee.requestPermission();

  const channelId = await createChannel();

  // Thời điểm bắt đầu (10s sau thời điểm hiện tại)
//   const initialTrigger = Date.now() + 10000;

  // Lặp lại sau mỗi 10s
  const repeatInterval = 5000;

  // Dùng setInterval để gửi lại local notification (Notifee không hỗ trợ repeatInterval < 15 phút)
  // Vì vậy ta dùng logic JS để lặp mỗi 10s
  setInterval(async () => {
    await notifee.displayNotification({
      title: 'Thông báo định kỳ',
      body: 'Đây là thông báo sau mỗi 5 giây ',
      android: {
        channelId,
        smallIcon: 'ic_launcher', // icon mặc định của app
      },
    });
  }, repeatInterval);
}
