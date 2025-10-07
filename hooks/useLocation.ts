import * as Location from "expo-location";
import { useEffect, useState } from "react";

export const useLocation = () => {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      try {
        // Xin quyền
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setError("Permission to access location was denied");
          return;
        }

        // Theo dõi vị trí liên tục
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Highest,
            //timeInterval: 2000, // 2s một lần
            distanceInterval: 1, // mọi di chuyển đều update
          
          },
          (loc) => {
            if (loc.coords.accuracy != null && loc.coords.accuracy <= 10) {
              setLocation({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
              });
            }
          }
        );
      } catch (e: any) {
        setError(e.message);
      }
    })();

    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  return { location, error };
};
