import notifee, { AndroidImportance, TimestampTrigger, TriggerType } from '@notifee/react-native';

// Khởi tạo channel cho Android
async function createChannel() {
  await notifee.createChannel({
    id: 'parking-notifications',
    name: 'Parking Notifications',
    description: 'Notifications for parking spots',
    sound: 'default',
    importance: AndroidImportance.HIGH,
    vibration: true,
  });
}

// Gọi createChannel khi khởi tạo
createChannel()
  .then(() => console.log('Notification channel created'))
  .catch(err => console.error('Failed to create notification channel:', err));

export const scheduleNotificationAtDate = async (
  title: string,
  body: string,
  date: Date
): Promise<string> => {
  try {
    // Tạo trigger với timestamp
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: date.getTime(),
    };

    // Schedule notification với trigger
    const id = await notifee.createTriggerNotification(
      {
        title,
        body,
        android: {
          channelId: 'parking-notifications',
          importance: AndroidImportance.HIGH,
          sound: 'default',
          pressAction: {
            id: 'default',
          },
        },
      },
      trigger
    );

    return id;
  } catch (error) {
    console.error('Failed to schedule notification:', error);
    return Math.floor(Math.random() * 1000000).toString(); // Fallback ID như logic cũ
  }
};

// Hàm helper để huỷ notification nếu cần
export const cancelNotification = async (id: string) => {
  try {
    await notifee.cancelNotification(id);
  } catch (error) {
    console.error('Failed to cancel notification:', error);
  }
};