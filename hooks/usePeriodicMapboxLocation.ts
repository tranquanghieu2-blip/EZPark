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

import { useEffect, useState, useRef } from "react";
import MapboxGL from "@rnmapbox/maps";
import { AppState } from 'react-native';

export const useSmartMapboxLocation = (minDistance = 10) => {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const locationRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const isTrackingRef = useRef(false);

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const startTracking = async () => {
    if (isTrackingRef.current) return;
    
    try {
      await MapboxGL.locationManager.start();
      isTrackingRef.current = true;

      MapboxGL.locationManager.addListener((loc) => {
        if (!loc?.coords) return;

        const { latitude, longitude } = loc.coords;

        if (!locationRef.current) {
          locationRef.current = { latitude, longitude };
          setLocation({ latitude, longitude });
          console.log("📍 Vị trí khởi đầu:", latitude, longitude);
          return;
        }

        const distance = getDistance(
          locationRef.current.latitude,
          locationRef.current.longitude,
          latitude,
          longitude
        );

        if (distance >= minDistance) {
          locationRef.current = { latitude, longitude };
          setLocation({ latitude, longitude });
          console.log(`📍 Cập nhật vị trí (${distance.toFixed(2)}m):`, latitude, longitude);
        }
      });
    } catch (err) {
      console.log("❌ Lỗi khi theo dõi vị trí:", err);
      isTrackingRef.current = false;
    }
  };

  const stopTracking = () => {
    if (!isTrackingRef.current) return;
    
    try {
      MapboxGL.locationManager.stop();
      isTrackingRef.current = false;
    } catch (err) {
      console.log("❌ Lỗi khi dừng theo dõi vị trí:", err);
    }
  };

  // Restart tracking khi app active lại
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        console.log("App active - restart location tracking");
        setTimeout(() => {
          stopTracking();
          startTracking();
        }, 1000); // delay 1s để đảm bảo GPS đã sẵn sàng
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    startTracking();

    return () => {
      stopTracking();
    };
  }, [minDistance]);

  return location;
};