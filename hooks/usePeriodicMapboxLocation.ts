
import { useEffect, useRef, useState } from 'react';
import MapboxGL from '@rnmapbox/maps';
import { AppState } from 'react-native';
import DeviceInfo from 'react-native-device-info';

export const useSmartMapboxLocation = (minDistance = 10) => {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // lưu last reported position (so sánh khoảng cách)
  const lastPosRef = useRef<{ latitude: number; longitude: number } | null>(
    null,
  );

  // trạng thái tracking
  const isTrackingRef = useRef(false);

  // lưu ref tới listener để huỷ
  const listenerRef = useRef<any>(null);

  //distance (haversine)
  const getDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) => {
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

  // internal: set location safely (and update lastPosRef)
  const setLocationSafe = (lat: number, lon: number) => {
    const cur = lastPosRef.current;
    if (!cur) {
      lastPosRef.current = { latitude: lat, longitude: lon };
      setLocation({ latitude: lat, longitude: lon });
      console.log('initial location set:', lat, lon);
      return;
    }
    const dist = getDistance(cur.latitude, cur.longitude, lat, lon);
    if (dist >= minDistance) {
      lastPosRef.current = { latitude: lat, longitude: lon };
      setLocation({ latitude: lat, longitude: lon });
      console.log(`location updated (${dist.toFixed(1)}m):`, lat, lon);
    }
  };

  const removeListener = async () => {
    try {
      if (listenerRef.current) {
        try {
          if (typeof listenerRef.current === 'function') {
            listenerRef.current();
          } else if (typeof listenerRef.current.remove === 'function') {
            listenerRef.current.remove();
          } else if (typeof listenerRef.current.unsubscribe === 'function') {
            listenerRef.current.unsubscribe();
          }
        } catch (er) {
          console.warn('Warning removing Mapbox listener:', er);
        }
        listenerRef.current = null;
      }
    } catch (err) {
      console.warn('Error in removeListener:', err);
    }
  };

  // start tracking: ensure previous listener removed first
  const startTracking = async () => {
    if (isTrackingRef.current) {
      // already tracking but ensure listener exists; if not, recreate
      if (listenerRef.current) return;
    }

    try {
      // try to start the Mapbox location manager
      await MapboxGL.locationManager.start();
      isTrackingRef.current = true;

      // Immediately attempt to get last known location (fast initial update)
      try {
        const last = await MapboxGL.locationManager.getLastKnownLocation?.();
        if (last?.coords) {
          setLocationSafe(last.coords.latitude, last.coords.longitude);
        }
      } catch (err) {
        // ignore - optional API might not exist in some versions
      }

      // remove old listener before adding a new one
      await removeListener();

      // add listener and keep subscription
      const sub = MapboxGL.locationManager.addListener((loc: any) => {
        if (!loc?.coords) return;
        const { latitude, longitude } = loc.coords;
        setLocationSafe(latitude, longitude);
      });

      listenerRef.current = sub;
      console.log('Mapbox location tracking started');
    } catch (err) {
      console.error('startTracking error:', err);
      isTrackingRef.current = false;
    }
  };

  const stopTracking = async () => {
    if (!isTrackingRef.current && !listenerRef.current) return;

    try {
      // stop location manager
      try {
        await MapboxGL.locationManager.stop();
      } catch (err) {
        // some Mapbox versions may throw; still attempt to remove listener
        console.warn('Warning stopping Mapbox locationManager:', err);
      }

      // remove listener/subscription
      await removeListener();

      isTrackingRef.current = false;
      console.log('Mapbox location tracking stopped');
    } catch (err) {
      console.error('stopTracking error:', err);
    }
  };

  // watch AppState: restart tracking when app becomes active
  useEffect(() => {
    const handleAppState = (nextState: string) => {
      if (nextState === 'active') {
        // small delay to allow system to re-enable providers
        setTimeout(() => {
          (async () => {
            try {
              await stopTracking();
              await startTracking();
            } catch (e) {
              console.warn('Error restarting tracking on active:', e);
            }
          })();
        }, 600);
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => {
      sub.remove();
    };
  }, []);

  useEffect(() => {
    let polling = true;
    let interval: NodeJS.Timeout | null = null;

    const startPoll = () => {
      interval = setInterval(async () => {
        try {
          const enabled = await DeviceInfo.isLocationEnabled();
          if (enabled && !isTrackingRef.current) {
            console.log(
              'Device location enabled detected: starting tracking',
            );
            await startTracking();
          } else if (!enabled && isTrackingRef.current) {
            // if user turned off location services while app open, stop to avoid useless work
            console.log('Device location disabled: stopping tracking');
            await stopTracking();
            lastPosRef.current = null;
            setLocation(null);
          }
        } catch (err) {
          console.warn('Error in GPS poll:', err);
        }
      }, 1500);
    };

    if (polling) startPoll();

    return () => {
      polling = false;
      if (interval) clearInterval(interval);
    };
  }, []);

  // initial mount: start tracking
  useEffect(() => {
    startTracking();

    return () => {
      stopTracking();
    };
  }, [minDistance]);

  return location;
};

export default useSmartMapboxLocation;
