// notifications.ts
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function ensurePermissions(): Promise<boolean> {
  try {
    const current = await Notifications.getPermissionsAsync();
    // nếu chưa được phép -> request
    if (!current.granted) {
      const asked = await Notifications.requestPermissionsAsync();
      if (!asked.granted) {
        console.warn("Notification permission denied");
        // thông báo cho người dùng (nếu cần)
        // Alert.alert("Quyền thông báo bị từ chối", "Vui lòng bật thông báo trong settings để nhận cảnh báo.");
        return false;
      }
    }
    return true;
  } catch (e) {
    console.warn("Error checking/requesting notification permissions", e);
    return false;
  }
}

async function ensureAndroidChannel() {
  if (Platform.OS === "android") {
    try {
      // tạo channel mặc định (an toàn cho Android 8+)
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.DEFAULT,
        // sound: 'default' // nếu cần sound mặc định
      });
    } catch (e) {
      console.warn("Failed to create Android notification channel", e);
    }
  }
}

/**
 * Schedule notification after delayMs milliseconds (seconds-based trigger).
 * Keep this as a reliable fallback.
 */
export async function scheduleNotificationInMs(
  title: string,
  body: string,
  delayMs: number
) {
  const seconds = Math.max(1, Math.ceil(delayMs / 1000));
  await ensurePermissions();
  await ensureAndroidChannel();
  // cast to any để tránh mismatch type giữa các phiên bản expo
  return Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: ({ type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds } as any),
  });
}

/**
 * Schedule by Date — try DATE trigger first; nếu lỗi thì fallback về seconds trigger.
 */
export async function scheduleNotificationAtDate(
  title: string,
  body: string,
  date: Date
) {
  const delay = date.getTime() - Date.now();
  if (delay <= 0) {
    console.log("Notification time in the past, skipping:", date);
    return null;
  }

  const ok = await ensurePermissions();
  if (!ok) return null;
  await ensureAndroidChannel();

  try {
    // Try the DATE-type trigger (recommended / semantically correct).
    const trigger: any = {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
    };
    const id = await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger,
    });
    console.log("Scheduled (date trigger) notification id:", id, "for", date.toISOString());
    return id;
  } catch (err) {
    // Nếu DATE trigger bị lỗi (vì bug trên một vài SDK / nền tảng), fallback về seconds-based.
    console.warn("DATE trigger failed, falling back to seconds-based schedule", err);
    return scheduleNotificationInMs(title, body, delay);
  }
}

/** Debug helper: in ra tất cả notifications đã được schedule (dùng để kiểm tra) */
export async function logAllScheduledNotifications() {
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    console.log("All scheduled notifications:", all);
    return all;
  } catch (e) {
    console.warn("Failed to get scheduled notifications", e);
    return null;
  }
}


// hủy thông báo đã được schedule
export async function cancelScheduledNotificationById(id: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
    console.log("Cancelled scheduled notification", id);
  } catch (e) {
    console.warn("Failed to cancel scheduled notification", e);
  }
}

export async function cancelScheduledNotificationsByIds(ids: string[] | undefined) {
  if (!ids || ids.length === 0) return;
  try {
    for (const id of ids) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }
    console.log("Cancelled ids:", ids);
  } catch (e) {
    console.warn("Failed to cancel scheduled notifications", e);
  }
}

