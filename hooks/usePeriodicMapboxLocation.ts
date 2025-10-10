import { useEffect, useState } from "react";
import MapboxGL from "@rnmapbox/maps";

/**
 * 🔁 Lấy vị trí người dùng định kỳ bằng Mapbox
 * @param intervalMs thời gian cập nhật (ms)
 */
export const usePeriodicMapboxLocation = (intervalMs = 5000) => {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>; // ✅ sửa kiểu ở đây

    const fetchLocation = async () => {
      try {
        const loc = await MapboxGL.locationManager.getLastKnownLocation();
        if (loc?.coords) {
          const { latitude, longitude } = loc.coords;
          setLocation({ latitude, longitude });
          console.log("📍 Cập nhật vị trí:", latitude, longitude);
        } else {
          console.log("⚠️ Không có dữ liệu vị trí từ Mapbox.");
        }
      } catch (err) {
        console.log("❌ Lỗi khi lấy vị trí từ Mapbox:", err);
      }
    };

    fetchLocation(); // lần đầu
    interval = setInterval(fetchLocation, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs]);

  return location;
};
