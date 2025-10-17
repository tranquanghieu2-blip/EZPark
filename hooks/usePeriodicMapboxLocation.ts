// import { useEffect, useState } from "react";
// import MapboxGL from "@rnmapbox/maps";

// /**
//  * 🔁 Lấy vị trí người dùng định kỳ bằng Mapbox
//  * @param intervalMs thời gian cập nhật (ms)
//  */
// export const usePeriodicMapboxLocation = (intervalMs = 5000) => {
//   const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

//   useEffect(() => {
//     let interval: ReturnType<typeof setInterval>; // ✅ sửa kiểu ở đây

//     const fetchLocation = async () => {
//       try {
//         const loc = await MapboxGL.locationManager.getLastKnownLocation();
//         if (loc?.coords) {
//           const { latitude, longitude } = loc.coords;
//           setLocation({ latitude, longitude });
//           console.log("📍 Cập nhật vị trí:", latitude, longitude);
//         } else {
//           console.log("⚠️ Không có dữ liệu vị trí từ Mapbox.");
//         }
//       } catch (err) {
//         console.log("❌ Lỗi khi lấy vị trí từ Mapbox:", err);
//       }
//     };

//     fetchLocation(); // lần đầu
//     interval = setInterval(fetchLocation, intervalMs);

//     return () => clearInterval(interval);
//   }, [intervalMs]);

//   return location;
// };

import { useEffect, useState } from "react";
import MapboxGL from "@rnmapbox/maps";

/**
 * 📡 Hook lấy vị trí người dùng — chỉ cập nhật khi di chuyển ≥ minDistance mét
 * @param minDistance khoảng cách tối thiểu (mét) để cập nhật lại vị trí
 */
export const useSmartMapboxLocation = (minDistance = 3) => {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // 👉 Hàm tính khoảng cách giữa 2 điểm (theo Haversine)
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000; // bán kính Trái Đất (m)
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // kết quả mét
  };

  useEffect(() => {
    let isMounted = true;

    const startTracking = async () => {
      try {
        await MapboxGL.locationManager.start();

        MapboxGL.locationManager.addListener((loc) => {
          if (!isMounted || !loc?.coords) return;

          const { latitude, longitude } = loc.coords;

          if (!location) {
            setLocation({ latitude, longitude });
            console.log("📍 Vị trí khởi đầu:", latitude, longitude);
            return;
          }

          const distance = getDistance(
            location.latitude,
            location.longitude,
            latitude,
            longitude
          );

          if (distance >= minDistance) {
            setLocation({ latitude, longitude });
            console.log(`📍 Cập nhật vị trí (${distance.toFixed(2)}m):`, latitude, longitude);
          }
        });
      } catch (err) {
        console.log("❌ Lỗi khi theo dõi vị trí:", err);
      }
    };

    startTracking();

    return () => {
      isMounted = false;
      MapboxGL.locationManager.stop();
    };
  }, [minDistance, location]);

  return location;
};
