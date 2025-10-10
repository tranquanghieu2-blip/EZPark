import { useEffect, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import Geolocation, { GeoPosition } from "react-native-geolocation-service";

export const useLocation = () => {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestPermission = async (): Promise<boolean> => {
    try {
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Yêu cầu quyền vị trí",
            message: "Ứng dụng cần quyền để xác định vị trí của bạn.",
            buttonPositive: "Đồng ý",
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    } catch (err) {
      console.log("❌ Lỗi khi xin quyền:", err);
      return false;
    }
  };

  useEffect(() => {
    let watchId: number | null = null;

    const start = async () => {
      const ok = await requestPermission();
      if (!ok) {
        setError("Permission denied");
        return;
      }

      Geolocation.getCurrentPosition(
        (pos: GeoPosition) => {
          console.log("✅ Lấy vị trí đầu tiên:", pos.coords);
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        (err) => {
          console.log("❌ Lỗi khi lấy vị trí:", err);
          setError(err.message);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );

      watchId = Geolocation.watchPosition(
        (pos: GeoPosition) => {
          console.log("📍 Theo dõi vị trí:", pos.coords);
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        (err) => {
          console.log("⚠️ Lỗi theo dõi vị trí:", err);
        },
        { enableHighAccuracy: true, distanceFilter: 1 }
      );
    };

    start();

    return () => {
      if (watchId !== null) {
        Geolocation.clearWatch(watchId);
        console.log("🧹 Dừng theo dõi vị trí");
      }
    };
  }, []);

  return { location, error };
};
