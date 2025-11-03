import haversine from "haversine-distance"; // npm i haversine-distance
import { getRoutes } from "@/service/routingService";
import { debounce } from "lodash"; 
import React, { useCallback, useRef, useState, useEffect, use } from 'react';
import { useSmartMapboxLocation } from "@/hooks/usePeriodicMapboxLocation";

  const userLocation = useSmartMapboxLocation();
const [lastRoutePos, setLastRoutePos] = useState<{ lat: number; lon: number } | null>(null);
const [routeCoords, setRouteCoords] = useState<{ longitude: number; latitude: number }[][]>([]);
const [destination, setDestination] = useState<{ lat: number; lon: number } | null>(null);

const updateDynamicRoute = useCallback(async (currentPos: { lat: number; lon: number }) => {
  if (!destination) return;

  const dist = lastRoutePos ? haversine(
    { lat: lastRoutePos.lat, lon: lastRoutePos.lon },
    { lat: currentPos.lat, lon: currentPos.lon }
  ) : Infinity;

  // chỉ gọi API nếu di chuyển > 40m
  if (dist < 40) return;

  try {
    const routes = await getRoutes(
      [currentPos.lon, currentPos.lat],
      [destination.lon, destination.lat]
    );
    if (routes?.[0]?.geometry?.coordinates) {
      const coords = routes[0].geometry.coordinates.map(([lon, lat]: [number, number]) => ({
        longitude: lon,
        latitude: lat,
      }));
      setRouteCoords([coords]);
      setLastRoutePos(currentPos);
    }
  } catch (e) {
    console.warn("Không thể cập nhật route:", e);
  }
}, [destination, lastRoutePos]);

const debouncedUpdateRoute = useRef(
  debounce((pos) => updateDynamicRoute(pos), 4000)
).current;

useEffect(() => {
  if (!userLocation) return;
  debouncedUpdateRoute({ lat: userLocation.latitude, lon: userLocation.longitude });
}, [userLocation]);