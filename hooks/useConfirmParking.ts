import notifee from "@notifee/react-native";
import { useEffect, useRef, useState } from "react";
import  {usePeriodicMapboxLocation}  from '@/hooks/usePeriodicMapboxLocation';
import { subscribeToRoute, unsubscribeFromRoute } from '@/service/fcm/fcmService';
import { isUserOnRoute, getPointDistanceMeters } from "@/hooks/Helper/UseConfirmParkringHelper";

const DEFAULT_MOVE_THRESHOLD_METERS = 30;

type ConfirmedState = {
  routeId: number;
  street?: string;
  confirmedAt: Date;
  confirmedLat: number;
  confirmedLon: number;
  endTime?: Date | null;
  route?: [number, number][];
  scheduledNotificationIds: string[];
};

export const useConfirmedParking = (opts?: { moveThresholdMeters?: number }) => {
 const location = usePeriodicMapboxLocation(5000);
  const moveThreshold = opts?.moveThresholdMeters ?? DEFAULT_MOVE_THRESHOLD_METERS;

  const [confirmed, setConfirmed] = useState<ConfirmedState | null>(null);
  const endTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Hủy local notification local */
  const cancelScheduledNotifications = async (ids?: string[]) => {
    if (!ids?.length) return;
    await Promise.all(ids.map((id) => notifee.cancelNotification(id)));
  };

  /** Xác nhận tuyến đường */
  const confirmRoute = async (params: {
    routeId: number;
    street?: string;
    confirmedLat: number;
    confirmedLon: number;
    endTime?: Date | null;
    route?: [number, number][];
    scheduledNotificationIds?: string[];
  }) => {
    // Không cho xác nhận lại
    if (confirmed?.routeId === params.routeId) return;

    // Đăng ký thông báo BE
    await subscribeToRoute(params.routeId);
    await notifee.requestPermission();

    setConfirmed({
      routeId: params.routeId,
      street: params.street,
      confirmedAt: new Date(),
      confirmedLat: params.confirmedLat,
      confirmedLon: params.confirmedLon,
      endTime: params.endTime ?? null,
      scheduledNotificationIds: [],
      route: params.route,
    });

    if (endTimerRef.current) clearTimeout(endTimerRef.current);
    if (params.endTime) {
      const ms = params.endTime.getTime() - Date.now();
      if (ms > 0) {
        endTimerRef.current = setTimeout(() => clearConfirmed(), ms + 500);
      }
    }
  };

  /** Hủy xác nhận */
  const clearConfirmed = async () => {
    if (!confirmed) return;
    await cancelScheduledNotifications(confirmed.scheduledNotificationIds);
    await unsubscribeFromRoute();
    setConfirmed(null);
    if (endTimerRef.current) {
      clearTimeout(endTimerRef.current);
      endTimerRef.current = null;
    }
  };

  /** Theo dõi vị trí để tự clear khi rời tuyến */
  useEffect(() => {
    if (!confirmed || !location) return;

    const stillOnRoute = confirmed.route
      ? isUserOnRoute(location.latitude, location.longitude, confirmed.route, moveThreshold)
      : getPointDistanceMeters(
          confirmed.confirmedLat,
          confirmed.confirmedLon,
          location.latitude,
          location.longitude
        ) < moveThreshold;

    if (!stillOnRoute) clearConfirmed();
  }, [location, confirmed, moveThreshold]);

  useEffect(() => {
    return () => {
      if (endTimerRef.current) clearTimeout(endTimerRef.current);
    };
  }, []);

  return { confirmed, confirmRoute, clearConfirmed };
};
