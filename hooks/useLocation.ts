// import * as Location from "expo-location";
// import { useEffect, useState } from "react";

// export const useLocation = () => {
//   const [location, setLocation] = useState<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     let subscription: Location.LocationSubscription | null = null;

//     (async () => {
//       try {
//         // Xin quyền
//         let { status } = await Location.requestForegroundPermissionsAsync();
//         if (status !== "granted") {
//           setError("Permission to access location was denied");
//           return;
//         }

//         // Theo dõi vị trí liên tục
//         subscription = await Location.watchPositionAsync(
//           {
//             accuracy: Location.Accuracy.Highest,
//             //timeInterval: 2000, // 2s một lần
//             distanceInterval: 1, // mọi di chuyển đều update
          
//           },
//           (loc) => {
//             if (loc.coords.accuracy != null && loc.coords.accuracy <= 10) {
//               setLocation({
//                 latitude: loc.coords.latitude,
//                 longitude: loc.coords.longitude,
//               });
//             }
//           }
//         );
//       } catch (e: any) {
//         setError(e.message);
//       }
//     })();

//     return () => {
//       if (subscription) subscription.remove();
//     };
//   }, []);

//   return { location, error };
// };

import { useEffect, useState } from "react";
import Geolocation from "react-native-geolocation-service";
import { PermissionsAndroid, Platform } from "react-native";

export const useLocation = () => {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Xin quyền vị trí
  const requestPermission = async () => {
    try {
      if (Platform.OS === "ios") {
        const auth = await Geolocation.requestAuthorization("whenInUse");
        if (auth === "granted") return true;
        setError("Permission denied");
        return false;
      }

      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Yêu cầu quyền truy cập vị trí",
            message: "Ứng dụng cần quyền để theo dõi vị trí của bạn.",
            buttonPositive: "Đồng ý",
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }

      return false;
    } catch (err) {
      console.warn(err);
      setError("Không thể xin quyền vị trí");
      return false;
    }
  };

  useEffect(() => {
    let watchId: number | null = null;

    (async () => {
      const hasPermission = await requestPermission();
      if (!hasPermission) return;

      watchId = Geolocation.watchPosition(
        (pos) => {
          if (pos.coords.accuracy && pos.coords.accuracy <= 10) {
            setLocation({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            });
          }
        },
        (err) => {
          console.warn(err);
          setError(err.message);
        },
        {
          enableHighAccuracy: true,
          distanceFilter: 1, // cập nhật mỗi khi di chuyển >= 1m
          interval: 2000, // (tùy chọn) cập nhật mỗi 2s
          fastestInterval: 1000,
        }
      );
    })();

    return () => {
      if (watchId !== null) {
        Geolocation.clearWatch(watchId);
      }
    };
  }, []);

  return { location, error };
};

