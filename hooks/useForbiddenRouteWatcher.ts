import { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import haversine from "haversine-distance";
import { fetchNoParkingRoutes } from "@/service/api";
import { isDayRestricted, isWithinTimeRange } from "@/utils/validation";
import dayjs from "dayjs";

const CACHE_KEY = "no_parking_routes_cache";

// Helper function - move outside component để không tạo lại
const isInBoundingBox = (
  userLoc: { latitude: number; longitude: number },
  routeBounds: { minLat: number; maxLat: number; minLon: number; maxLon: number }
) => {
  return (
    userLoc.latitude >= routeBounds.minLat &&
    userLoc.latitude <= routeBounds.maxLat &&
    userLoc.longitude >= routeBounds.minLon &&
    userLoc.longitude <= routeBounds.maxLon
  );
};

// Helper function to calculate bounds
function calculateBounds(coordinates: [number, number][]): {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
} {
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;

  for (const [lon, lat] of coordinates) {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
  }

  return { minLat, maxLat, minLon, maxLon };
}

export function useForbiddenRouteWatcher({
  userLocation,
  onEnterZone,
  onExitZone,
}: {
  userLocation: { latitude: number; longitude: number } | null;
  onEnterZone?: (route: NoParkingRoute) => void;
  onExitZone?: (route: NoParkingRoute) => void;
}) {
  const [routes, setRoutes] = useState<NoParkingRoute[]>([]);
  const [routesWithBounds, setRoutesWithBounds] = useState<
    (NoParkingRoute & { bounds: ReturnType<typeof calculateBounds> })[]
  >([]);
  const [currentZone, setCurrentZone] = useState<NoParkingRoute | null>(null);
  const isFetching = useRef(false);

  // ---- Load từ cache hoặc API ----
  useEffect(() => {
    const loadRoutes = async () => {
      try {
        const cache = await AsyncStorage.getItem(CACHE_KEY);
        // console.log("Cache: ", cache)
        if (cache) {
          const parsed = JSON.parse(cache);
          setRoutes(parsed.data);
          // Pre-calculate bounds cho cached data
          const withBounds = parsed.data.map((route: NoParkingRoute) => ({
            bounds: calculateBounds(route.route.coordinates),
            ...route,
          }));
          setRoutesWithBounds(withBounds);

          const diffDays = dayjs().diff(dayjs(parsed.lastUpdated), "day");
          console.log("Diff day:", diffDays)
          if (diffDays < 6) return; // refresh mỗi 6 ngày
        }

        if (!isFetching.current) {
          console.log("IsFetch: ", !isFetching.current)
          isFetching.current = true;
          const fresh = await fetchNoParkingRoutes();
          console.log("Fresh: ", fresh)
          await AsyncStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ data: fresh, lastUpdated: new Date().toISOString() })
          );
          setRoutes(fresh);

          // Pre-calculate bounds cho fresh data
          const withBounds = fresh.map((route) => ({
            ...route,
            bounds: calculateBounds(route.route.coordinates),
          }));
          console.log("Bound:", withBounds)
          setRoutesWithBounds(withBounds);

          isFetching.current = false;
        }
      } catch (err) {
        console.error("Lỗi load tuyến cấm:", err);
      }
    };

    loadRoutes();
  }, []);

  // ---- Kiểm tra vị trí người dùng ----
  useEffect(() => {
    if (!userLocation || routesWithBounds.length === 0) return;

    let inZone = false;
    let matchedZone: NoParkingRoute | null = null;
    const now = new Date();

    for (const route of routesWithBounds) {
      if (!isDayRestricted(now, route.days_restricted)) continue;
      if (!isWithinTimeRange(now, route.time_range)) continue;
      if (!route.route?.coordinates) continue;

      // Fast bounding box check với pre-calculated bounds
      if (!isInBoundingBox(userLocation, route.bounds)) continue;

      for (const [lon, lat] of route.route.coordinates) {
        const distance = haversine(
          { latitude: lat, longitude: lon },
          { latitude: userLocation.latitude, longitude: userLocation.longitude }
        );
        if (distance <= 25) {
          inZone = true;
          matchedZone = route;
          break;
        }
      }

      if (inZone) break;
    }

    if (inZone && !currentZone) {
      setCurrentZone(matchedZone);
      onEnterZone?.(matchedZone!);
    } else if (!inZone && currentZone) {
      setCurrentZone(null);
      onExitZone?.(currentZone);
    }
  }, [userLocation, routesWithBounds]);

  return { currentZone, routes: routesWithBounds };
}
