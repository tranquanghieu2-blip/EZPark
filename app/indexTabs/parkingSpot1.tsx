// ================= Thông dụng =================
import React, { useCallback, useRef, useState, useEffect, use } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  View,
  PermissionsAndroid,
  Platform,
  Modal,
  Pressable,
  Animated,
  Vibration,
} from 'react-native';
// @ts-ignore
import MapboxGL from '@rnmapbox/maps';

// ================= Components =================
import CircleButton from '@/components/CircleButton';
import {
  IconCrosshairs,
  IconQuestion,
  IconRain,
  IconCancelRouting,
} from '@/components/Icons';
import SearchBar from '@/components/SearchBar';
import { IconFavorite } from '@/components/Icons';
// import UserLocationMarker from '@/components/UserLocation';
// ================= Constants =================
import Colors from '@/constants/colors';
import { icons } from '@/constants/icons';
import { daNangRegion } from '@/constants/mapBounds';
// ================= Modals =================
import FloodReportModal from '@/modals/FloodReportModal';
import { HelpModalParkingSpot } from '@/modals/HelpModal';
import ParkingSpotDetailModal from '../../modals/ParkingSpotModal';
import ConfirmParkingRoutesModal from '../../modals/ConfirmParkingRoutes';
// ================= Custom hooks =================
import { useScheduleTimeTriggers } from '@/hooks/useScheduleTimeTriggers';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import useFetch from '../../hooks/useFetch';
import { useSmartMapboxLocation } from '@/hooks/usePeriodicMapboxLocation';

// ================= Services =================
import {
  fetchNoParkingRoutes,
  fetchParkingSpotDetail,
  fetchParkingSpots,
} from '../../service/api';
import { checkFavoriteParkingSpot } from '@/service/api';

// import { startRepeatingNotification } from '@/service/testNoti';
// ================= Utils =================
import { clusterPolylines } from '@/utils/clusterPolylines';
import { isDayRestricted, isWithinTimeRange } from '@/utils/validation';
import { NativeModules } from 'react-native';
import messaging from '@react-native-firebase/messaging';

import { Point } from 'geojson';
import DeviceInfo from 'react-native-device-info';
import {
  mapEvents,
  EVENT_OPEN_SPOT,
  EVENT_FAVORITE_CHANGED,
  EVENT_USER_LOGOUT,
  EVENT_FORBIDDEN_ROUTE_ENTER,
  EVENT_FORBIDDEN_ROUTE_EXIT,
} from '@/utils/eventEmitter';

import { getRoutes } from '@/service/routingService';
import haversine from 'haversine-distance';
import { debounce, map } from 'lodash';
import { useAuth } from '../context/AuthContext';
import { useParkingSpotDetail } from '@/hooks/useParkingSpotDetail';
import { images } from '@/constants/images';

// ================= Component =================
const ParkingSpot = () => {
  const { user } = useAuth();
  const location = useSmartMapboxLocation(1);
  console.log('Render Parking Spot');
  const shapeSourceRef = useRef<MapboxGL.ShapeSource>(null);
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const navigation = useNavigation<any>();
  const mapRef = useRef<MapboxGL.MapView>(null);
  const [region, setRegion] = useState(daNangRegion);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [routeCoords, setRouteCoords] = useState<
    { longitude: number; latitude: number }[][]
  >([]);

  const [isRouting, setIsRouting] = useState(false);

  const [showParkingDetail, setShowParkingDetail] = useState(false);
  const [showRouteConfirm, setShowRouteConfirm] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<NoParkingRoute | null>(
    null,
  );
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showInstructionModal, setShowInstructionModal] = useState(false);
  const [changedFavorites, setChangedFavorites] = useState<Set<number>>(
    new Set(),
  );
  // const { user } = useAuth();

  // lưu điểm đích và vị trí cuối cùng để tính lại route
  const [destination, setDestination] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [lastRoutePos, setLastRoutePos] = useState<{
    lat: number;
    lon: number;
  } | null>(null);

  const [isManualControl, setIsManualControl] = useState(false);
  const [favoriteSpots, setFavoriteSpots] = useState<Set<number>>(new Set());

  useEffect(() => {
    const handleUserLogout = () => {
      console.log('User has logged out — resetting ParkingSpot state');

      // Xoá các dữ liệu chỉ dành cho user
      setFavoriteSpots(new Set());
      setChangedFavorites(new Set());
      setSelectedId(null);
      setShowParkingDetail(false);
    };

    mapEvents.on(EVENT_USER_LOGOUT, handleUserLogout);

    return () => {
      mapEvents.off(EVENT_USER_LOGOUT, handleUserLogout);
    };
  }, [navigation]);

  useEffect(() => {
    const handleOpenSpot = (spotId: number) => {
      setSelectedId(spotId);
      setShowParkingDetail(true);
    };

    mapEvents.on(EVENT_OPEN_SPOT, handleOpenSpot);

    return () => {
      mapEvents.off(EVENT_OPEN_SPOT, handleOpenSpot);
    };
  }, []);

  const prevRouteRef = useRef(routeCoords);

  useEffect(() => {
    // Chỉ chạy khi routeCoords thực sự thay đổi nội dung
    if (JSON.stringify(prevRouteRef.current) === JSON.stringify(routeCoords)) {
      return;
    }
    prevRouteRef.current = routeCoords;

    if (!cameraRef.current) return;
    if (!routeCoords || routeCoords.length === 0) {
      // Nếu muốn trả camera về vị trí người dùng khi hủy route:
      if (userLocation && cameraRef.current) {
        cameraRef.current.setCamera({
          centerCoordinate: [userLocation.longitude, userLocation.latitude],
          zoomLevel: 13,
          animationDuration: 700,
        });
      }
      return;
    }

    // Lấy route chính (route đầu tiên)
    const coords = routeCoords[0];
    if (!coords || coords.length === 0) return;

    // Tính bounding box
    let minLat = coords[0].latitude;
    let maxLat = coords[0].latitude;
    let minLon = coords[0].longitude;
    let maxLon = coords[0].longitude;

    coords.forEach(p => {
      if (p.latitude < minLat) minLat = p.latitude;
      if (p.latitude > maxLat) maxLat = p.latitude;
      if (p.longitude < minLon) minLon = p.longitude;
      if (p.longitude > maxLon) maxLon = p.longitude;
    });

    // Thêm small padding vào bbox (dạng độ, an toàn)
    const latPadding = (maxLat - minLat) * 0.15 || 0.002; // 15% hoặc min safe
    const lonPadding = (maxLon - minLon) * 0.15 || 0.002;

    const sw = [minLon - lonPadding, minLat - latPadding]; // [lon, lat]
    const ne = [maxLon + lonPadding, maxLat + latPadding]; // [lon, lat]

    try {
      //setCamera với bounds
      cameraRef.current.fitBounds(ne, sw, 80, 900);
    } catch (err) {
      console.warn(
        'Error fitting camera to route bounds, fallback to center/zoom:',
        err,
      );
      // fallback: center to midpoint + zoom
      const midLat = (minLat + maxLat) / 2;
      const midLon = (minLon + maxLon) / 2;
      cameraRef.current.setCamera({
        centerCoordinate: [midLon, midLat],
        zoomLevel: 12,
        animationDuration: 700,
      });
    }
  }, [routeCoords, cameraRef, userLocation, isManualControl]);

  useEffect(() => {
    if (!location) {
      // GPS tắt
      setUserLocation(null);
      return;
    }
    // GPS bật
    if (
      !userLocation ||
      location.latitude !== userLocation.latitude ||
      location.longitude !== userLocation.longitude
    ) {
      setUserLocation(location);
    }
  }, [location]);

  // === PERMISSIONS ===
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Yêu cầu quyền truy cập vị trí',
          message: 'Ứng dụng cần quyền để theo dõi vị trí của bạn.',
          buttonPositive: 'Đồng ý',
          buttonNegative: 'Từ chối',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    setIsRouting(routeCoords.length > 0);
  }, [routeCoords]);

  // === Fetch parking spots ===
  const {
    data: parkingSpots,
    loading: parkingSpotsLoad,
    error: parkingSpotsError,
  } = useFetch<ParkingSpot[]>(fetchParkingSpots);

  // === Fetch parking spot detail ===
  const {
    spot: parkingSpotDetail,
    loading: parkingSpotDetailLoad,
    fetchParkingSpotDetailWithStats,
  } = useParkingSpotDetail();

  // Hàm fetch chi tiết khi selectedId thay đổi
  const fetchDetail = useCallback(async () => {
    if (selectedId == null || userLocation == null) return;
    await fetchParkingSpotDetailWithStats(selectedId, userLocation);
  }, [selectedId, userLocation]);

  // Tự động gọi khi selectedId thay đổi
  useEffect(() => {
    if (selectedId != null) {
      fetchDetail();
    }
  }, [selectedId]);

  // === Fetch no-parking routes ===
  const { data: noParkingRoutes } =
    useFetch<NoParkingRoute[]>(fetchNoParkingRoutes);

  // === Trigger time updates ===
  const [, forceUpdate] = useState(0);
  const triggerUpdate = useCallback(() => forceUpdate(x => x + 1), []);
  useScheduleTimeTriggers(noParkingRoutes, triggerUpdate, 'allowed');

  // === Khi bản đồ thay đổi (Mapbox) ===
  const onRegionDidChange = async () => {
    try {
      const center = await mapRef.current?.getCenter();
      if (center) {
        setRegion({
          ...region,
          latitude: center[0],
          longitude: center[0],
        });
      }
    } catch (error) {
      console.warn('Không thể lấy tâm bản đồ:', error);
    }
  };

  //logic cập nhật route động theo vị trí hiện tại
  const updateDynamicRoute = useCallback(
    async (currentPos: { lat: number; lon: number }) => {
      if (!destination) return;

      const dist =
        lastRoutePos &&
        haversine(
          { lat: lastRoutePos.lat, lon: lastRoutePos.lon },
          { lat: currentPos.lat, lon: currentPos.lon },
        );

      // Chỉ cập nhật nếu di chuyển > 40m
      if (dist && dist < 40) return;

      try {
        const routes = await getRoutes(
          [currentPos.lon, currentPos.lat],
          [destination.lon, destination.lat],
        );

        if (routes?.[0]?.geometry?.coordinates) {
          const coords = routes[0].geometry.coordinates.map(
            ([lon, lat]: [number, number]) => ({
              longitude: lon,
              latitude: lat,
            }),
          );
          setRouteCoords([coords]);
          setLastRoutePos(currentPos);
        }
      } catch (error) {
        console.warn('Không thể cập nhật route:', error);
      }
    },
    [destination, lastRoutePos],
  );
  //debounce để tránh gọi API quá nhiều
  const debouncedUpdateRoute = useRef(
    debounce(
      (pos: { lat: number; lon: number }) => updateDynamicRoute(pos),
      4000,
    ),
  ).current;
  //mỗi khi userLocation thay đổi, tính lại route
  useEffect(() => {
    if (!userLocation || !destination) return;
    debouncedUpdateRoute({
      lat: userLocation.latitude,
      lon: userLocation.longitude,
    });
  }, [userLocation, destination]);

  // Check favorite spots
  useEffect(() => {
    if (!user) return;

    const handleFavoriteChange = (spotId: number) => {
      setChangedFavorites(prev => new Set([...prev, spotId]));
    };

    mapEvents.on(EVENT_FAVORITE_CHANGED, handleFavoriteChange);
    return () => {
      mapEvents.off(EVENT_FAVORITE_CHANGED, handleFavoriteChange);
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    if (!parkingSpots?.length) return;

    const checkAllFavorites = async () => {
      try {
        const favoritePromises = parkingSpots.map(spot =>
          checkFavoriteParkingSpot(spot.parking_spot_id)
            .then(result => ({
              spotId: spot.parking_spot_id,
              isFavorite: result.isFavorite,
            }))
            .catch(() => ({ spotId: spot.parking_spot_id, isFavorite: false })),
        );

        const favoriteResults = await Promise.all(favoritePromises);

        const favoriteSet = new Set<number>();
        favoriteResults.forEach(result => {
          if (result.isFavorite) {
            favoriteSet.add(result.spotId);
          }
        });

        setFavoriteSpots(favoriteSet);
      } catch (error) {
        console.error('Error checking all favorites:', error);
      }
    };

    checkAllFavorites();
  }, [parkingSpots, user]);

  useFocusEffect(
    useCallback(() => {
      console.log('ParkingSpot screen focused');
      // Fetch danh sách bãi đỗ
      fetchParkingSpots();
      // Fetch chi tiết bãi đỗ nếu có selectedId và userLocation
      if (selectedId && userLocation) {
        fetchParkingSpotDetailWithStats(selectedId, userLocation);
      }

      // Chỉ refresh các favorites bị thay đổi
      if (user && changedFavorites.size > 0) {
        const refreshChangedFavorites = async () => {
          try {
            const updates = await Promise.all(
              Array.from(changedFavorites).map(spotId =>
                checkFavoriteParkingSpot(spotId)
                  .then(result => ({ spotId, isFavorite: result.isFavorite }))
                  .catch(() => ({ spotId, isFavorite: false })),
              ),
            );

            // Clone Set hiện tại
            const updatedSet = new Set(favoriteSpots);

            // Cập nhật từng spot bị thay đổi
            updates.forEach(({ spotId, isFavorite }) => {
              if (isFavorite) updatedSet.add(spotId);
              else updatedSet.delete(spotId);
            });

            setFavoriteSpots(updatedSet);
            setChangedFavorites(new Set());

            console.log(
              'Refreshed changed favorites:',
              updates.map(u => u.spotId),
            );
          } catch (err) {
            console.error('Error refreshing changed favorites:', err);
          }
        };

        refreshChangedFavorites();
      }

      // Không cần cleanup ở đây
    }, [selectedId, userLocation, user, changedFavorites, favoriteSpots]),
  );

  // STATE để hiển thị cảnh báo tuyến cấm shared từ NoParkingRoute
  const [currentForbiddenRoute, setCurrentForbiddenRoute] =
    useState<NoParkingRoute | null>(null);

  // sử dụng cùng tên như noParkingRoute: showBanner / showBadge / showModal
  const [showBanner, setShowBanner] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const onEnter = (route: NoParkingRoute) => {
      setCurrentForbiddenRoute(route);
      Vibration.vibrate(300);
      setShowBanner(true);
      setShowBadge(false);
      console.log('Received forbidden route enter event:', route?.street);
    };
    const onExit = () => {
      setCurrentForbiddenRoute(null);
      setShowBanner(false);
      setShowBadge(false);
      setShowModal(false);
      console.log('Received forbidden route exit event');
    };

    mapEvents.on(EVENT_FORBIDDEN_ROUTE_ENTER, onEnter);
    mapEvents.on(EVENT_FORBIDDEN_ROUTE_EXIT, onExit);

    return () => {
      mapEvents.off(EVENT_FORBIDDEN_ROUTE_ENTER, onEnter);
      mapEvents.off(EVENT_FORBIDDEN_ROUTE_EXIT, onExit);
    };
  }, []);

  // Khi vừa vào tuyến cấm → tự ẩn banner sau 7s và hiện badge
  useEffect(() => {
    if (!currentForbiddenRoute) {
      setShowBanner(false);
      setShowBadge(false);
      setShowModal(false);
      return;
    }

    setShowBanner(true);
    setShowBadge(false);
    const timer = setTimeout(() => {
      setShowBanner(false);
      setShowBadge(true);
    }, 7000);

    return () => clearTimeout(timer);
  }, [currentForbiddenRoute]);

  // fade banner
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: showBanner ? 1 : 0,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [showBanner, fadeAnim]);

  // pulse badge
  useEffect(() => {
    if (!showBadge) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [showBadge, pulseAnim]);

  return (
    <View style={styles.container}>
      {/* Banner tuyến cấm chung (hiện lên cả trên ParkingSpot) */}
      {showBanner && currentForbiddenRoute && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 75,
            left: 16,
            right: 16,
            zIndex: 999,
            backgroundColor: Colors.warning,
            borderRadius: 8,
            padding: 10,
            opacity: fadeAnim,
            shadowOpacity: 0.4,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 4,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>
            🚫 Bạn đang đi vào tuyến cấm đỗ xe!
          </Text>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
            {currentForbiddenRoute.street}
          </Text>
        </Animated.View>
      )}

      {/* Badge nhỏ (sau khi banner ẩn sẽ hiện badge) */}
      {showBadge && currentForbiddenRoute && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 80,
            right: 15,
            backgroundColor: Colors.warning,
            borderRadius: 24,
            width: 46,
            height: 46,
            justifyContent: 'center',
            alignItems: 'center',
            transform: [{ scale: pulseAnim }],
            zIndex: 999,
            elevation: 5,
          }}
        >
          <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
            {/* touch -> mở modal chi tiết */}
            <Pressable onPress={() => setShowModal(true)}>
              <IconQuestion color="white" size={24} />
            </Pressable>
          </View>
        </Animated.View>
      )}

      {/* Modal chi tiết khi bấm badge */}
      <Modal visible={showModal} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#0007',
          }}
        >
          <View
            style={{
              backgroundColor: 'white',
              padding: 20,
              borderRadius: 12,
              width: '80%',
            }}
          >
            <Text
              style={{
                fontWeight: 'bold',
                fontSize: 18,
                color: Colors.warning,
              }}
            >
              🚫 Bạn đang di chuyển trên tuyến cấm đỗ
            </Text>
            <Text style={{ marginTop: 8, fontWeight: '600' }}>
              {currentForbiddenRoute?.street}
            </Text>
            <Pressable
              style={{
                backgroundColor: '#eee',
                marginTop: 16,
                padding: 10,
                paddingHorizontal: 35,
                borderRadius: 6,
              }}
              onPress={() => setShowModal(false)}
            >
              <Text style={{ textAlign: 'center', fontWeight: '500', fontSize: 16 }}>
                Đã hiểu
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Thanh tìm kiếm */}
      <SearchBar
        placeholder="Tìm bãi đỗ xe..."
        onPress={() => navigation.navigate('SearchParkingSpot' as never)}
      />

      {/* Nút nổi */}
      <View className="absolute right-4 bottom-10 z-20 flex-col space-y-4 gap-3">
        {isRouting && (
          <CircleButton
            icon={<IconCancelRouting size={40} color={Colors.danger} />}
            bgColor="#000000c5"
            onPress={() => {
              setRouteCoords([]);
              setDestination(null);
              setLastRoutePos(null);
              setShowInstructionModal(false);
              setShowDropdown(false);
            }}
          />
        )}

        <CircleButton
          icon={
            <Image source={images.chatbot} style={{ width: 35, height: 25 }} />
          }
          bgColor="#fff"
          onPress={() => navigation.navigate('ChatBot')}
        />

        <CircleButton
          icon={<IconQuestion size={20} color={Colors.blue_button} />}
          bgColor="#fff"
          onPress={() => setShowHelp(true)}
        />
        <CircleButton
          icon={<IconCrosshairs size={20} color={Colors.blue_button} />}
          bgColor="#fff"
          onPress={() => {
            if (userLocation && cameraRef.current) {
              cameraRef.current.setCamera({
                centerCoordinate: [
                  userLocation.longitude,
                  userLocation.latitude,
                ],
                zoomLevel: 15,
                animationDuration: 800,
              });
            }
          }}
        />
      </View>

      <HelpModalParkingSpot
        visible={showHelp}
        onClose={() => setShowHelp(false)}
      />

      {/* Mapbox Map */}
      <MapboxGL.MapView
        ref={mapRef}
        style={styles.map}
        styleURL={MapboxGL.StyleURL.Street}
        onRegionDidChange={onRegionDidChange}
        scaleBarEnabled={false}
        attributionEnabled={false}
        compassEnabled={false}
        logoEnabled={false}
        zoomEnabled={true}
        scrollEnabled={true}
        pitchEnabled={false}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          defaultSettings={{
            bounds: {
              ne: [108.35, 16.15], //DONG BAC
              sw: [107.95, 15.85], // TAY NAM
            },
          }}
          zoomLevel={10}
        />

        {routeCoords.length > 0 &&
          routeCoords.map((route, idx) => (
            <MapboxGL.ShapeSource
              key={`routeLine-${idx}`}
              id={`routeLine-${idx}`}
              shape={{
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: route.map(p => [p.longitude, p.latitude]),
                },
                properties: {},
              }}
            >
              <MapboxGL.LineLayer
                id={`routeOutline-${idx}`}
                style={{
                  lineColor: '#ffffff',
                  lineWidth: idx === 0 ? 7 : 6,
                  lineOpacity: 0.9,
                  lineJoin: 'round',
                  lineCap: 'round',
                }}
              />

              <MapboxGL.LineLayer
                id={`routeMain-${idx}`}
                aboveLayerID={`routeOutline-${idx}`}
                style={{
                  lineColor: idx === 0 ? '#307bddff' : '#3585ecff',
                  lineWidth: idx === 0 ? 6 : 4,
                  lineOpacity: idx === 0 ? 1 : 0.9,
                  lineBlur: 0.3,
                  lineJoin: 'round',
                  lineCap: 'round',
                }}
              />
            </MapboxGL.ShapeSource>
          ))}

        {/* MARKERS: origin & destination */}
        {routeCoords.length > 0 &&
          (() => {
            const main = routeCoords[0];
            if (!main || main.length === 0) return null;
            const origin = main[0];
            const destination = main[main.length - 1];

            return (
              <>
                <MapboxGL.PointAnnotation
                  id="route-origin"
                  key="route-origin"
                  coordinate={[origin.longitude, origin.latitude]}
                >
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: '#fff',
                      borderWidth: 3,
                      borderColor: '#307bdd',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: '#307bdd',
                      }}
                    />
                  </View>
                </MapboxGL.PointAnnotation>

                <MapboxGL.PointAnnotation
                  id="route-destination"
                  key="route-destination"
                  coordinate={[destination.longitude, destination.latitude]}
                >
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: '#fff',
                      borderWidth: 3,
                      borderColor: '#34c759',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: '#34c759',
                      }}
                    />
                  </View>
                </MapboxGL.PointAnnotation>
              </>
            );
          })()}

        {/* custom user marker (dùng location từ useSmartMapboxLocation) */}
        {userLocation && (
          <MapboxGL.PointAnnotation
            id="user-marker"
            key="user-marker"
            coordinate={[userLocation.longitude, userLocation.latitude]}
          >
            {/* Outer white border */}
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 16,
                backgroundColor: '#000000ff',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Inner dot */}
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 16,
                  backgroundColor: '#4285F4',
                  borderWidth: 3,
                  borderColor: '#ffffffff',
                }}
              />
            </View>
          </MapboxGL.PointAnnotation>
        )}

        {/* No Parking Routes */}
        {noParkingRoutes?.map(route => {
          const now = new Date();
          if (isDayRestricted(now, route.days_restricted)) {
            if (isWithinTimeRange(now, route.time_range)) return null;
          }
          const coords = route.route.coordinates.map(([lon, lat]) => [
            lon,
            lat,
          ]);
          const isSelected = selectedRouteId === route.no_parking_route_id;
          return (
            <MapboxGL.ShapeSource
              key={`npr-${route.no_parking_route_id}`}
              id={`npr-${route.no_parking_route_id}`}
              shape={{
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: coords },
                properties: {
                  routeId: route.no_parking_route_id,
                  ...route,
                },
              }}
              onPress={e => {
                const feature = e.features?.[0];
                if (!feature || !feature.properties) return;
                const routeId = feature.properties.routeId;
                console.log('Clicked route ID:', routeId);

                const selectedRoute = noParkingRoutes?.find(
                  r => r.no_parking_route_id == routeId,
                );

                if (selectedRoute) {
                  setSelectedRoute(selectedRoute);
                  setShowRouteConfirm(true);
                  setSelectedRouteId(routeId);
                  // Di chuyển camera đến vị trí bãi đỗ
                  if (selectedRoute?.route?.coordinates?.length) {
                    const coords = selectedRoute.route.coordinates;
                    const midIndex = Math.floor(coords.length / 2);
                    const [lon, lat] = coords[midIndex]; // Lấy điểm giữa tuyến

                    cameraRef.current?.setCamera({
                      centerCoordinate: [lon, lat],
                      zoomLevel: 14,
                      animationDuration: 700,
                    });
                  }
                }
              }}
            >
              <MapboxGL.LineLayer
                id={`npr-layer-${route.no_parking_route_id}`}
                belowLayerID="unclustered-point"
                style={{
                  lineColor: 'green', //  Đổi màu khi chọn
                  lineWidth: isSelected ? 6 : 4, // Tăng độ dày
                  lineOpacity: isSelected ? 0.9 : 0.6, //  Làm nổi bật hơn
                }}
              />
            </MapboxGL.ShapeSource>
          );
        })}

        {/* <MapboxGL.UserLocation
          visible={true}
          showsUserHeadingIndicator={false}
          minDisplacement={10} // chỉ cập nhật khi di chuyển ít nhất 10 mét
          onUpdate={() => {
            console.log('UPDATE USER LOCATION');
          }}
        /> */}

        {/* === Parking Spot Clustering === */}
        {parkingSpots && (
          <MapboxGL.ShapeSource
            ref={shapeSourceRef}
            id="parkingSpots"
            shape={{
              type: 'FeatureCollection',
              features: parkingSpots.map(spot => ({
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [spot.longitude, spot.latitude],
                },
                properties: {
                  id: spot.parking_spot_id,
                  latitude: spot.latitude,
                  longitude: spot.longitude,
                  isFavorite: favoriteSpots.has(spot.parking_spot_id),
                },
                ...spot,
              })),
            }}
            cluster={true}
            clusterRadius={40}
            onPress={async e => {
              const feature = e.features?.[0];
              if (!feature || !feature.properties) return;

              const isCluster = !!feature.properties.cluster_id;

              if (isCluster) {
                const clusterId = feature.properties.cluster_id;
                console.log('Clicked cluster with ID:', clusterId);

                if (!shapeSourceRef.current) {
                  console.log('ShapeSource ref not available');
                  return;
                }

                // Kiểm tra có tọa độ hợp lệ
                if (feature.geometry && 'coordinates' in feature.geometry) {
                  const coordinates = feature.geometry.coordinates as [
                    number,
                    number,
                  ];

                  try {
                    // Lấy zoom hiện tại và tăng thêm 2 level
                    const currentZoom = await mapRef.current?.getZoom();
                    const newZoom = currentZoom ? currentZoom + 2 : 15;

                    if (cameraRef.current) {
                      cameraRef.current.setCamera({
                        centerCoordinate: coordinates,
                        zoomLevel: newZoom,
                        animationDuration: 500,
                      });
                    }
                  } catch (error) {
                    console.error('Error during camera movement:', error);

                    // fallback khi lỗi
                    if (cameraRef.current) {
                      cameraRef.current.setCamera({
                        centerCoordinate: coordinates,
                        zoomLevel: 15,
                        animationDuration: 500,
                      });
                    }
                  }
                }
              } else {
                // Nếu click vào marker (không phải cluster)
                const spotData = feature.properties;
                setSelectedId(spotData.id);
                setShowParkingDetail(true);
                // Di chuyển camera đến vị trí bãi đỗ
                if (
                  cameraRef.current &&
                  spotData.longitude &&
                  spotData.latitude
                ) {
                  cameraRef.current.setCamera({
                    centerCoordinate: [spotData.longitude, spotData.latitude],
                    zoomLevel: 14,
                    animationDuration: 700,
                  });
                }
              }
            }}
          >
            {/* ảnh icon */}
            <MapboxGL.Images
              images={{
                parkingIcon: icons.iconParkingSpot,
                favoriteIcon: icons.iconFavorite,
              }}
            />

            {/* Marker riêng lẻ */}
            <MapboxGL.SymbolLayer
              id="unclustered-point"
              filter={['!', ['has', 'point_count']]}
              style={{
                iconImage: [
                  'case',
                  ['==', ['get', 'isFavorite'], true], // Nếu isFavorite = true
                  'favoriteIcon', // Hiển thị icon yêu thích
                  'parkingIcon', // Ngược lại hiển thị icon parking bình thường
                ],
                iconSize: [
                  'case',
                  ['==', ['get', 'isFavorite'], true],
                  0.9, // icon lớn hơn nếu là favorite
                  0.7, // mặc định nhỏ hơn
                ],
                iconAllowOverlap: true,
                symbolSortKey: 10,
              }}
            />

            {/* Cluster tròn */}
            <MapboxGL.CircleLayer
              id="clustered-points"
              filter={['has', 'point_count']}
              style={{
                circleColor: [
                  'step',
                  ['get', 'point_count'],
                  '#00c0ef', // <10
                  10,
                  '#1189e5', // 10-49
                  50,
                  '#313dde', // 50-99
                ],
                circleRadius: [
                  'step',
                  ['get', 'point_count'],
                  12, // <10 mặc định
                  10,
                  18, // lớn hơn 10 thì 18
                  50,
                  24,
                  100,
                  30,
                ],
                circleOpacity: 1,
                circleStrokeColor: 'white',
                circleStrokeWidth: 1.5,
              }}
            />

            {/* Số lượng cluster */}
            <MapboxGL.SymbolLayer
              id="cluster-count"
              filter={['has', 'point_count']}
              style={{
                textField: ['get', 'point_count'],
                textSize: 12,
                textColor: '#fff',
                textFont: ['Open Sans Bold', 'Arial Unicode MS Bold'],
                symbolSortKey: 11,
              }}
            />
          </MapboxGL.ShapeSource>
        )}
      </MapboxGL.MapView>

      {/* Loading */}
      {parkingSpotsLoad && (
        <ActivityIndicator
          size="large"
          color={Colors.blue_button}
          className="absolute top-32 self-center z-20"
        />
      )}

      {/* Error */}
      {parkingSpotsError && (
        <Text className="absolute bottom-10 self-center z-20 text-red-600 bg-white/90 px-3 py-1 rounded-lg font-medium">
          Không thể tải dữ liệu bãi đỗ xe
        </Text>
      )}

      {/* Modal cho Parking Spot Detail */}
      <ParkingSpotDetailModal
        key={`${selectedId}-${showParkingDetail ? 'open' : 'closed'}`} // ép render lại khi mở lại modal
        visible={showParkingDetail}
        onClose={() => setShowParkingDetail(false)}
        loading={parkingSpotDetailLoad}
        error={parkingSpotsError}
        detail={parkingSpotDetail}
        showInstructionModal={showInstructionModal}
        showDropdown={showDropdown}
        currentLocation={userLocation}
        onSetShowInstructionModal={setShowInstructionModal}
        onSetShowDropdown={setShowDropdown}
        onRouteFound={coords => {
          setRouteCoords(coords);
          if (userLocation && coords.length > 0) {
            const main = coords[0];
            const destinationPoint = main[main.length - 1];
            setDestination({
              lat: destinationPoint.latitude,
              lon: destinationPoint.longitude,
            });
            setLastRoutePos({
              lat: userLocation.latitude,
              lon: userLocation.longitude,
            });
          }
        }}
      />

      {/* Modal cho Route Confirmation */}
      {selectedRoute && (
        <ConfirmParkingRoutesModal
          route={selectedRoute}
          onClose={() => {
            setSelectedRoute(null);
            setShowRouteConfirm(false);
            setSelectedRouteId(null);
          }}
        />
      )}
    </View>
  );
};

export default ParkingSpot;

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});
