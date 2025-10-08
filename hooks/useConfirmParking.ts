// useConfirmParking.ts
// import * as Notifications from "expo-notifications";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "./useLocation"; // hook vị trí

/** Khoảng cách (m) mà khi người dùng rời khỏi vị trí đỗ, chúng ta coi là đã "di chuyển" */
const DEFAULT_MOVE_THRESHOLD_METERS = 30;

/** Haversine distance (meters) */
export function getDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371000; // m
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Kiểm tra user có nằm gần đoạn tuyến (A-B) không */
export function isUserOnRoute(
  userLat: number,
  userLon: number,
  start: [number, number], // [lat, lon]
  end: [number, number],   // [lat, lon]
  toleranceMeters: number
): boolean {
  const [startLat, startLon] = start;
  const [endLat, endLon] = end;

  const dAB = getDistanceMeters(startLat, startLon, endLat, endLon);
  const dAP = getDistanceMeters(startLat, startLon, userLat, userLon);
  const dPB = getDistanceMeters(userLat, userLon, endLat, endLon);

  // Nếu P nằm trên đoạn AB thì AP + PB ≈ AB
  return Math.abs((dAP + dPB) - dAB) <= toleranceMeters;
}

type ConfirmedState = {
  routeId: number;
  street?: string;
  confirmedAt: Date;
  confirmedLat: number;
  confirmedLon: number;
  endTime?: Date | null;
  scheduledNotificationIds: string[]; // để huỷ khi clear
};

export const useConfirmedParking = (opts?: { moveThresholdMeters?: number }) => {
  const { location } = useLocation();
  const moveThreshold = opts?.moveThresholdMeters ?? DEFAULT_MOVE_THRESHOLD_METERS;

  const [confirmed, setConfirmed] = useState<ConfirmedState | null>(null);
  const endTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // helper: cancel scheduled notifications by id
  const cancelScheduledNotifications = async (ids?: string[]) => {
    if (!ids || ids.length === 0) return;
    try {
      for (const id of ids) {
        // await Notifications.cancelScheduledNotificationAsync(id);
      }
    } catch (e) {
      console.warn("Failed cancel scheduled notifications", e);
    }
  };

  // Confirm a route
  const confirmRoute = async (params: {
    routeId: number;
    street?: string;
    confirmedLat: number;
    confirmedLon: number;
    endTime?: Date | null;
    scheduledNotificationIds?: string[];
  }) => {
    if (confirmed?.scheduledNotificationIds?.length) {
      await cancelScheduledNotifications(confirmed.scheduledNotificationIds);
    }

    setConfirmed({
      routeId: params.routeId,
      street: params.street,
      confirmedAt: new Date(),
      confirmedLat: params.confirmedLat,
      confirmedLon: params.confirmedLon,
      endTime: params.endTime ?? null,
      scheduledNotificationIds: params.scheduledNotificationIds ?? [],
    });

    if (endTimerRef.current) {
      clearTimeout(endTimerRef.current);
      endTimerRef.current = null;
    }
    if (params.endTime) {
      const ms = params.endTime.getTime() - Date.now();
      if (ms > 0) {
        endTimerRef.current = setTimeout(() => {
          clearConfirmed();
        }, ms + 500);
      }
    }
  };

  // Clear confirmed
  const clearConfirmed = async () => {
    if (!confirmed) return;
    await cancelScheduledNotifications(confirmed.scheduledNotificationIds);
    setConfirmed(null);
    if (endTimerRef.current) {
      clearTimeout(endTimerRef.current);
      endTimerRef.current = null;
    }
  };

  // Effect: watch for movement
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
        clearConfirmed().catch((e) => console.warn("clearConfirmed error", e));
      }
    } catch (e) {
      console.warn("Distance check error", e);
    }
  }, [location, confirmed]);

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
