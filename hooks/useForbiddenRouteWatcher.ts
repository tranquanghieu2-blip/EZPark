import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import haversine from 'haversine-distance';
import { fetchNoParkingRoutes } from '@/service/api';
import { isDayRestricted, isWithinTimeRange } from '@/utils/validation';
import dayjs from 'dayjs';

const CACHE_KEY = 'no_parking_routes_cache';

// Tính khoảng cách giữa 2 điểm (meters)
const dist = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  return haversine({ lat: lat1, lon: lon1 }, { lat: lat2, lon: lon2 });
};

// Tính khoảng cách từ point → đoạn thẳng (polyline segment)
function distanceToSegment(
  p: { latitude: number; longitude: number },
  a: [number, number],
  b: [number, number],
) {
  const [lon1, lat1] = a;
  const [lon2, lat2] = b;

  // Vector A -> B (trong lat/lon - không chính xác cho khoảng cách lớn)
  const ABx = lon2 - lon1;
  const ABy = lat2 - lat1;

  // Vector A -> P
  const APx = p.longitude - lon1;
  const APy = p.latitude - lat1;

  // Dot product
  const dot = ABx * APx + ABy * APy;
  const lenSq = ABx * ABx + ABy * ABy;
  const t = Math.max(0, Math.min(1, dot / lenSq));

  // Projection point
  const projLon = lon1 + ABx * t;
  const projLat = lat1 + ABy * t;

  // ← SỬA: Dùng haversine thay vì Euclidean
  return haversine(
    { lat: p.latitude, lon: p.longitude },
    { lat: projLat, lon: projLon },
  );
}

// Tính khoảng cách từ user → polyline hoàn chỉnh
function distanceToPolyline(
  point: { latitude: number; longitude: number },
  coords: [number, number][],
) {
  let min = Infinity;

  for (let i = 0; i < coords.length - 1; i++) {
    const d = distanceToSegment(point, coords[i], coords[i + 1]);
    if (d < min) min = d;
  }

  return min;
}

// Helper function - move outside component để không tạo lại
const isInBoundingBox = (
  userLoc: { latitude: number; longitude: number },
  routeBounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  },
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
  userLocation: { latitude: number; longitude: number } | null; // ← Cho phép null
  onEnterZone?: (route: NoParkingRoute) => void;
  onExitZone?: (route: NoParkingRoute) => void;
}) {
  const [routes, setRoutes] = useState<NoParkingRoute[]>([]);
  const [routesWithBounds, setRoutesWithBounds] = useState<
    (NoParkingRoute & { bounds: ReturnType<typeof calculateBounds> })[]
  >([]);
  const [currentZone, setCurrentZone] = useState<NoParkingRoute | null>(null);
  const isFetching = useRef(false);
  const lastPos = useRef<{ lat: number; lon: number } | null>(null); // ← THÊM

  // ---- Load từ cache hoặc API ----
  useEffect(() => {
    const loadRoutes = async () => {
      console.log('Loading routes...');
      try {
        const cache = await AsyncStorage.getItem(CACHE_KEY);
        console.log('Cache:', cache ? 'found' : 'not found');

        if (cache) {
          const parsed = JSON.parse(cache);
          console.log('Cached routes:', parsed.data.length);
          setRoutes(parsed.data);

          // Pre-calculate bounds cho cached data
          const withBounds = parsed.data.map((route: NoParkingRoute) => ({
            ...route,
            bounds: calculateBounds(route.route.coordinates),
          }));
          setRoutesWithBounds(withBounds);
          console.log('Routes with bounds loaded:', withBounds.length);

          const diffDays = dayjs().diff(dayjs(parsed.lastUpdated), 'days');
          console.log('Cache age:', diffDays, 'days');

          if (diffDays < 6) {
            console.log('Cache valid, skipping fetch');
            return; // refresh mỗi 6 ngày
          }
        }

        if (!isFetching.current) {
          console.log('Fetching fresh routes...');
          isFetching.current = true;
          const fresh = await fetchNoParkingRoutes();
          console.log('Fetched:', fresh?.length, 'routes');

          await AsyncStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              data: fresh,
              lastUpdated: new Date().toISOString(),
            }),
          );
          setRoutes(fresh);

          // Pre-calculate bounds cho fresh data
          const withBounds = fresh.map(route => ({
            ...route,
            bounds: calculateBounds(route.route.coordinates),
          }));
          console.log('Fresh routes with bounds:', withBounds.length);
          setRoutesWithBounds(withBounds);

          isFetching.current = false;
        }
      } catch (err) {
        console.error('Error loading routes:', err);
      }
    };

    loadRoutes();
  }, []);

  // ---- Kiểm tra vị trí người dùng ----
  useEffect(() => {
    // ← Kiểm tra null TRƯỚC
    if (!userLocation || routesWithBounds.length === 0) {
      console.log('Skipping check:', {
        hasLocation: !!userLocation,
        routeCount: routesWithBounds.length,
      });
      return;
    }

    console.log('Checking location:', userLocation);

    // ← THÊM: Check movement threshold
    if (lastPos.current) {
      const moved = haversine(
        { lat: lastPos.current.lat, lon: lastPos.current.lon },
        { lat: userLocation.latitude, lon: userLocation.longitude },
      );
      console.log('🚶 Moved:', moved.toFixed(2), 'm');

      if (moved < 10) {
        // ← Chỉ check khi di chuyển >= 3m
        console.log('Movement too small, skipping');
        return;
      }
    }

    lastPos.current = {
      lat: userLocation.latitude,
      lon: userLocation.longitude,
    };

    let inZone = false;
    let matchedZone: NoParkingRoute | null = null;
    const now = new Date();

    for (const route of routesWithBounds) {
      const isDayOk = isDayRestricted(now, route.days_restricted);
      const isTimeOk = isWithinTimeRange(now, route.time_range);

      if (!isDayOk) {
        continue;
      }
      if (!isTimeOk) {
        continue;
      }

      if (!route.route?.coordinates) {
        continue;
      }

      // Fast bounding box check với pre-calculated bounds
      if (!isInBoundingBox(userLocation, route.bounds)) {
        continue;
      }

      console.log('Inside bounding box, checking detailed distance');

      // Tính khoảng cách thực sự giữa user và tuyến đường (polyline)
      const polylineDistance = distanceToPolyline(
        userLocation,
        route.route.coordinates,
      );

      console.log('📏 Polyline distance:', polylineDistance);

      if (polylineDistance <= 40) {
        inZone = true;
        matchedZone = route;
      }

      if (inZone) break;
    }

    // ← SỬA: Cho phép vào tuyến mới ngay cả khi đã ở trong tuyến cũ
    if (
      inZone &&
      (!currentZone ||
        currentZone.no_parking_route_id !== matchedZone?.no_parking_route_id)
    ) {
      // Nếu đang ở tuyến cũ → gọi onExitZone trước
      if (currentZone) {
        console.log('Exiting old zone:', currentZone.street);
        onExitZone?.(currentZone);
      }

      console.log('Entering new zone:', matchedZone?.street);
      onEnterZone?.(matchedZone!);
      setCurrentZone(matchedZone);
    } else if (!inZone && currentZone) {
      console.log('Exiting zone:', currentZone.street);
      onExitZone?.(currentZone);
      setCurrentZone(null);
    }
  }, [userLocation, routesWithBounds, currentZone]);

  return { currentZone };
}
