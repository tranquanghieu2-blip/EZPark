import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import haversine from 'haversine-distance';
import { fetchNoParkingRoutes } from '@/service/api';
import { isDayRestricted, isWithinTimeRange } from '@/utils/validation';
import dayjs from 'dayjs';

const CACHE_KEY = 'no_parking_routes_cache';
const LOCATION_CHECK = {
  MIN_MOVEMENT_M: 10,
  FORBIDDEN_ZONE_RADIUS_M: 40,
};

// Tính khoảng cách từ point đoạn thẳng
function distanceToSegment(
  p: { latitude: number; longitude: number },
  a: [number, number],
  b: [number, number],
) {
  const [lon1, lat1] = a;
  const [lon2, lat2] = b;

  // Vector A -> B
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

  return haversine(
    { lat: p.latitude, lon: p.longitude },
    { lat: projLat, lon: projLon },
  );
}

// Tính khoảng cách từ user đến polyline
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

// Check user có nằm trong bounding box của tuyến đường không
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

//calculate bounds
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
  const [routesWithBounds, setRoutesWithBounds] = useState<
    (NoParkingRoute & { bounds: ReturnType<typeof calculateBounds> })[]
  >([]);
  const [currentZone, setCurrentZone] = useState<NoParkingRoute | null>(null);
  const isFetching = useRef(false);
  const lastPos = useRef<{ lat: number; lon: number } | null>(null); // ← THÊM

  // Load từ API lưu vô cache, quá 6 ngày mới load
  // useEffect(() => {
  //   const loadRoutes = async () => {
  //     console.log('Loading routes...');

  //     try {
  //       const cacheStr = await AsyncStorage.getItem(CACHE_KEY);

  //       let needFetch = true;

  //       if (cacheStr) {
  //         const parsed = JSON.parse(cacheStr);
  //         const { data, lastUpdated } = parsed;

  //         console.log('Cached routes:', data);

  //         const diffDays = dayjs().diff(dayjs(lastUpdated), 'day');
  //         console.log('Cache age:', diffDays, 'days');

  //         setRoutesWithBounds(
  //           data.map((r: NoParkingRoute) => ({
  //             ...r,
  //             bounds: calculateBounds(r.route.coordinates),
  //           })),
  //         );

  //         if (diffDays < 6) {
  //           console.log('Cache valid, skip fetch');
  //           needFetch = false;
  //         }
  //       }

  //       if (needFetch && !isFetching.current) {
  //         console.log('Fetching fresh routes...');
  //         isFetching.current = true;

  //         const fresh = await fetchNoParkingRoutes();
  //         console.log('New routes fetched:', fresh?.length);

  //         setRoutesWithBounds(
  //           fresh.map(route => ({
  //             ...route,
  //             bounds: calculateBounds(route.route.coordinates),
  //           })),
  //         );

  //         // Update cache
  //         await AsyncStorage.setItem(
  //           CACHE_KEY,
  //           JSON.stringify({
  //             data: fresh,
  //             lastUpdated: new Date().toISOString(),
  //           }),
  //         );

  //         isFetching.current = false;
  //       }
  //     } catch (e) {
  //       console.error('Error loading routes:', e);
  //       isFetching.current = false;
  //     }
  //   };

  //   loadRoutes();
  // }, []);

  // dùng cho test demo khi thêm tuyến mới
  useEffect(() => {
    const loadRoutes = async () => {
      console.log('Loading fresh routes...');

      try {
        isFetching.current = true;

        // Luôn fetch API trước
        const fresh = await fetchNoParkingRoutes();

        console.log('Fetched fresh:', fresh);

        //Update state = data mới
        // setRoutes(fresh);
        const withBounds = fresh.map(route => ({
          ...route,
          bounds: calculateBounds(route.route.coordinates),
        }));
        setRoutesWithBounds(withBounds);

        //Ghi đè cache
        await AsyncStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            data: fresh,
            lastUpdated: new Date().toISOString(),
          }),
        );

        isFetching.current = false;
      } catch (err) {
        console.log('API failed:', err);

        isFetching.current = false;

        // Nếu API lỗi thì load cache
        const cache = await AsyncStorage.getItem(CACHE_KEY);
        if (cache) {
          const parsed = JSON.parse(cache);

          const withBounds = parsed.data.map((route: NoParkingRoute) => ({
            ...route,
            bounds: calculateBounds(route.route.coordinates),
          }));
          setRoutesWithBounds(withBounds);
        }
      }
    };

    loadRoutes();
  }, []);

  // Kiểm tra vị trí người dùng
  useEffect(() => {
    // Kiểm tra null trước
    if (!userLocation || routesWithBounds.length === 0) {
      console.log('Skipping check:', {
        hasLocation: !!userLocation,
        routeCount: routesWithBounds.length,
      });
      return;
    }

    console.log('Checking location:', userLocation);

    //  Check đi đc bnh mét
    if (lastPos.current) {
      const moved = haversine(
        { lat: lastPos.current.lat, lon: lastPos.current.lon },
        { lat: userLocation.latitude, lon: userLocation.longitude },
      );
      console.log('Moved:', moved.toFixed(2), 'm');

      // chỉ check khi di chuyển >= 10m
      if (moved < LOCATION_CHECK.MIN_MOVEMENT_M) {
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

      if (!isDayOk || !isTimeOk || !route.route?.coordinates) {
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

      console.log(' Polyline distance:', polylineDistance);

      if (polylineDistance <= LOCATION_CHECK.FORBIDDEN_ZONE_RADIUS_M) {
        inZone = true;
        matchedZone = route;
      }

      if (inZone) break;
    }

    //Cho phép vào tuyến mới ngay cả khi đã ở trong tuyến cũ
    if (
      inZone &&
      (!currentZone ||
        currentZone.no_parking_route_id !== matchedZone?.no_parking_route_id)
    ) {
      // Nếu đang ở tuyến cũ gọi onExitZone trước
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
