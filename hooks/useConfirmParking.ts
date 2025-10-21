import notifee from "@notifee/react-native";
import { useState, useRef, useEffect } from "react";
import {
  subscribeToRoute,
  unsubscribeFromRoute,
} from "@/service/fcm/fcmService";
import AsyncStorage from '@react-native-async-storage/async-storage';

type ConfirmedState = {
  routeId: number;
  street?: string;
  confirmedAt: Date;
  confirmedLat: number;
  confirmedLon: number;
  endTime?: Date | null;
  route?: [number, number][];
};

export const useConfirmedParking = () => {
  const [confirmed, setConfirmed] = useState<ConfirmedState | null>(null);
  const endTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Xác nhận đỗ xe
  const confirmRoute = async (params: {
    routeId: number;
    street?: string;
    confirmedLat: number;
    confirmedLon: number;
    endTime?: Date | null;
    route?: [number, number][];
  }) => {
    try {
      await subscribeToRoute(params.routeId);
      await notifee.requestPermission();

      setConfirmed({
        routeId: params.routeId,
        street: params.street,
        confirmedAt: new Date(),
        confirmedLat: params.confirmedLat,
        confirmedLon: params.confirmedLon,
        endTime: params.endTime ?? null,
        route: params.route,
      });

      console.log("Đã xác nhận đỗ:", params.routeId);
    } catch (err) {
      console.error("confirmRoute error:", err);
    }
  };

  // Hủy xác nhận đỗ xe
  const clearConfirmed = async () => {
    try {
      await unsubscribeFromRoute();
      setConfirmed(null);
      console.log("Đã hủy xác nhận đỗ");
    } catch (err) {
      console.error("clearConfirmed error:", err);
    }
  };

  // Tải trạng thái khi khởi động
  useEffect(() => {
    const loadState = async () => {
      try {
        const savedState = await AsyncStorage.getItem('confirmedParking');
        if (savedState) {
          const parsed = JSON.parse(savedState);
          if (parsed.confirmedAt) parsed.confirmedAt = new Date(parsed.confirmedAt);
          if (parsed.endTime) parsed.endTime = parsed.endTime ? new Date(parsed.endTime) : null;
          setConfirmed(parsed);
          console.log("Đã tải trạng thái đỗ xe:", parsed);
        }
      } catch (err) {
        console.error("Lỗi tải trạng thái:", err);
      }
    };
    loadState();
  }, []);

  // Lưu trạng thái khi thay đổi
  useEffect(() => {
    const saveState = async () => {
      try {
        if (confirmed) {
          await AsyncStorage.setItem('confirmedParking', JSON.stringify(confirmed));
          console.log("Đã lưu trạng thái đỗ xe");
        } else {
          await AsyncStorage.removeItem('confirmedParking');
          console.log("Đã xóa trạng thái đỗ xe");
        }
      } catch (err) {
        console.error("Lỗi lưu trạng thái:", err);
      }
    };
    saveState();
  }, [confirmed]);

  useEffect(() => {
    return () => {
      if (endTimerRef.current) clearTimeout(endTimerRef.current);
    };
  }, []);

  return { confirmed, confirmRoute, clearConfirmed };
};
