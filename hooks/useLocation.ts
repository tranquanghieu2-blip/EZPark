import { useEffect, useState } from "react";
import Geolocation, {
  GeoPosition,
  GeoError,
} from "react-native-geolocation-service";
import { PermissionsAndroid, Platform } from "react-native";

/**
 * Hook theo dõi vị trí người dùng, an toàn và tránh crash khi xin quyền
 */
export const useLocation = () => {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Xin quyền vị trí (Android + iOS)
   */
  const requestPermission = async (): Promise<boolean> => {
    try {
      if (Platform.OS === "ios") {
        const auth = await Geolocation.requestAuthorization("whenInUse");
        if (auth === "granted") return true;
        setError("Bạn chưa cấp quyền truy cập vị trí");
        return false;
      }

      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Yêu cầu quyền truy cập vị trí",
            message: "Ứng dụng cần quyền để theo dõi vị trí của bạn.",
            buttonPositive: "Đồng ý",
            buttonNegative: "Từ chối",
          }
        );

        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }

      return false;
    } catch (err) {
      console.warn("Lỗi khi xin quyền:", err);
      setError("Không thể xin quyền vị trí");
      return false;
    }
  };

  useEffect(() => {
    let watchId: number | null = null;

    const startWatching = async () => {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        setLocation(null);
        return;
      }

      // ✅ Double-check sau khi user vừa nhấn “Cho phép” (tránh race condition)
      const stillGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      if (Platform.OS === "android" && !stillGranted) {
        console.log("Permission chưa sẵn sàng, hủy khởi tạo Geolocation");
        return;
      }

      // ✅ Thêm delay ngắn để Android xử lý permission hoàn tất
      await new Promise((resolve) => setTimeout(resolve, 500));

      // ✅ Lấy vị trí ban đầu
      Geolocation.getCurrentPosition(
        (pos: GeoPosition) => {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        (err: GeoError) => {
          console.warn("Lỗi lấy vị trí ban đầu:", err);
          setError(err.message);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );

      // ✅ Theo dõi vị trí liên tục
      watchId = Geolocation.watchPosition(
        (pos: GeoPosition) => {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        (err: GeoError) => {
          console.warn("Lỗi theo dõi vị trí:", err);
          setError(err.message);
        },
        {
          enableHighAccuracy: true,
          distanceFilter: 1, // cập nhật khi di chuyển ≥ 1m
          interval: 2000,
          fastestInterval: 1000,
        }
      );
    };

    startWatching();

    return () => {
      if (watchId !== null) {
        Geolocation.clearWatch(watchId);
      }
      Geolocation.stopObserving();
    };
  }, []);

  return { location, error };
};

