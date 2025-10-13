import notifee, { TimestampTrigger, TriggerType } from "@notifee/react-native";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "./useLocation"; // hook vị trí

const DEFAULT_MOVE_THRESHOLD_METERS = 30;

/** Haversine distance (meters) */
export function getDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Kiểm tra user có nằm gần đoạn tuyến (A-B) không */
export function isUserOnRoute(
  userLat: number,
  userLon: number,
  start: [number, number],
  end: [number, number],
  toleranceMeters: number
): boolean {
  const [startLat, startLon] = start;
  const [endLat, endLon] = end;

  const dAB = getDistanceMeters(startLat, startLon, endLat, endLon);
  const dAP = getDistanceMeters(startLat, startLon, userLat, userLon);
  const dPB = getDistanceMeters(userLat, userLon, endLat, endLon);

  return Math.abs(dAP + dPB - dAB) <= toleranceMeters;
}

type ConfirmedState = {
  routeId: number;
  street?: string;
  confirmedAt: Date;
  confirmedLat: number;
  confirmedLon: number;
  endTime?: Date | null;
  scheduledNotificationIds: string[];
};

export const useConfirmedParking = (opts?: { moveThresholdMeters?: number }) => {
  const { location } = useLocation();
  const moveThreshold = opts?.moveThresholdMeters ?? DEFAULT_MOVE_THRESHOLD_METERS;

  const [confirmed, setConfirmed] = useState<ConfirmedState | null>(null);
  const endTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Huỷ thông báo đã lên lịch */
  const cancelScheduledNotifications = async (ids?: string[]) => {
    if (!ids?.length) return;
    try {
      await Promise.all(ids.map((id) => notifee.cancelNotification(id)));
    } catch (e) {
      console.warn("Failed to cancel notifications", e);
    }
  };

  /** Tạo thông báo Notifee */
  const scheduleLocalNotification = async (title: string, body: string, date: Date) => {
    try {
      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: date.getTime(),
        alarmManager: true, // đảm bảo báo thức nền (Android)
      };

      const channelId = await notifee.createChannel({
        id: "parking_channel",
        name: "Parking Notifications",
        importance: 4,
      });

      const notificationId = await notifee.createTriggerNotification(
        {
          id: `parking_${date.getTime()}`,
          title,
          body,
          android: {
            channelId,
            pressAction: {
              id: "default",
            },
          },
        },
        trigger
      );

      return notificationId;
    } catch (e) {
      console.warn("Failed to schedule notification", e);
      return undefined;
    }
  };

  /** Xác nhận bãi đỗ */
  const confirmRoute = async (params: {
    routeId: number;
    street?: string;
    confirmedLat: number;
    confirmedLon: number;
    endTime?: Date | null;
  }) => {
    if (confirmed?.scheduledNotificationIds?.length) {
      await cancelScheduledNotifications(confirmed.scheduledNotificationIds);
    }

    let scheduledIds: string[] = [];

    // Nếu có endTime → tạo thông báo hết hạn
    if (params.endTime) {
      const notificationId = await scheduleLocalNotification(
        "Hết thời gian đỗ xe",
        "Thời gian đỗ của bạn đã kết thúc. Vui lòng di chuyển xe.",
        params.endTime
      );
      if (notificationId) scheduledIds.push(notificationId);
    }

    setConfirmed({
      routeId: params.routeId,
      street: params.street,
      confirmedAt: new Date(),
      confirmedLat: params.confirmedLat,
      confirmedLon: params.confirmedLon,
      endTime: params.endTime ?? null,
      scheduledNotificationIds: scheduledIds,
    });

    // Hẹn giờ tự clear khi hết hạn
    if (endTimerRef.current) clearTimeout(endTimerRef.current);
    if (params.endTime) {
      const ms = params.endTime.getTime() - Date.now();
      if (ms > 0) {
        endTimerRef.current = setTimeout(() => {
          clearConfirmed();
        }, ms + 500);
      }
    }
  };

  /** Clear xác nhận */
  const clearConfirmed = async () => {
    if (!confirmed) return;
    await cancelScheduledNotifications(confirmed.scheduledNotificationIds);
    setConfirmed(null);
    if (endTimerRef.current) {
      clearTimeout(endTimerRef.current);
      endTimerRef.current = null;
    }
  };

  /** Theo dõi di chuyển người dùng */
  useEffect(() => {
    if (!confirmed || !location) return;

    try {
      const d = getDistanceMeters(
        confirmed.confirmedLat,
        confirmed.confirmedLon,
        location.latitude,
        location.longitude
      );
      if (d >= moveThreshold) {
        clearConfirmed();
      }
    } catch (e) {
      console.warn("Distance check error", e);
    }
  }, [location, confirmed]);

  /** Cleanup khi unmount */
  useEffect(() => {
    return () => {
      if (endTimerRef.current) clearTimeout(endTimerRef.current);
    };
  }, []);

  const isRouteConfirmed = (routeId?: number | null) =>
    confirmed ? confirmed.routeId === routeId : false;

  return {
    confirmed,
    confirmRoute,
    clearConfirmed,
    isRouteConfirmed,
  };
};
