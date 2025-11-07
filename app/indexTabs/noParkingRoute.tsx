import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  View,
  Pressable,
  Modal,
  Vibration,
} from 'react-native';
import MapboxGL from '@rnmapbox/maps';
// ================= Components =================
import CircleButton from '@/components/CircleButton';
import { IconCrosshairs, IconQuestion } from '@/components/Icons';
import SearchBar from '@/components/SearchBar';
// ================= Constants =================
import Colors from '@/constants/colors';
import { icons } from '@/constants/icons';
import { DA_NANG_CENTER, DA_NANG_VIEWPORT } from '@/constants/danangMap';
// ================= Custom hooks =================
import useFetch from '@/hooks/useFetch';
import { useScheduleTimeTriggers } from '@/hooks/useScheduleTimeTriggers';
// ================= Services =================
import {
  fetchNoParkingRoutes,
  updateNoParkingRouteGeometry,
} from '@/service/api';
import { getRoutes } from '@/service/routingService';
// ================= Utils =================
import { clusterPolylines } from '@/utils/clusterPolylines';
import { getPolylineStyleOfRoute } from '@/utils/polylineStyle';
import { isDayRestricted, isWithinTimeRange } from '@/utils/validation';
// ================= Modals =================
import { HelpModalNoParkingRoute } from '@/modals/HelpModal';
import NoParkingRouteModal from '@/modals/NoParkingRouteModal';
import { images } from '@/constants/images';
import { useNavigation } from '@react-navigation/native';
import haversine from 'haversine-distance';
import { Animated } from 'react-native';
import { useForbiddenRouteWatcher } from '@/hooks/useForbiddenRouteWatcher';
import { useSmartMapboxLocation } from '@/hooks/usePeriodicMapboxLocation';
import { set } from 'lodash';

const NoParkingRoute = () => {
  const location = useSmartMapboxLocation();
  console.log('Render No Parking Route');
  const navigation = useNavigation<any>();

  // ================== STATE ==================
  const [center, setCenter] = useState<{ latitude: number; longitude: number }>(
    DA_NANG_CENTER,
  );
  const [routes, setRoutes] = useState<NoParkingRoute | null>(null);
  const [region, setRegion] = useState<{
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }>(DA_NANG_VIEWPORT);
  const [zoomLevel, setZoomLevel] = useState(12);
  const [selectedRoute, setSelectedRoute] = useState<NoParkingRoute | null>(
    null,
  );
  const [showHelp, setShowHelp] = useState(false);
  const [routesWithGeometry, setRoutesWithGeometry] = useState<
    NoParkingRoute[] | null
  >(null);

  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // ================== REF ==================
  const mapRef = useRef<MapboxGL.MapView>(null);
  const cameraRef = useRef<MapboxGL.Camera>(null);

  // ================== DATA FETCH ==================

  const {
    data: noParkingRoutes,
    loading: noParkingRoutesLoad,
    error: noParkingRoutesError,
  } = useFetch<NoParkingRoute[]>(fetchNoParkingRoutes);

  // ================== GEOMETRY ==================
  useEffect(() => {
    if (!noParkingRoutes) return;

    const enrichGeometry = async () => {
      try {
        const updatedRoutes = await Promise.all(
          noParkingRoutes.map(async route => {
            if (route.route) return route;
            try {
              const routeData = await getRoutes(
                route.location_begin,
                route.location_end,
              );
              if (routeData?.geometry) {
                const geometry = routeData.geometry;
                await updateNoParkingRouteGeometry(
                  route.no_parking_route_id,
                  geometry,
                );
                return { ...route, geometry };
              } else {
                console.warn(
                  `Không có geometry cho route: ${route.no_parking_route_id}`,
                );
                return route;
              }
            } catch (err) {
              console.error(
                'Lỗi tính polyline cho route:',
                route.no_parking_route_id,
                err,
              );
              return route;
            }
          }),
        );
        setRoutesWithGeometry(updatedRoutes);
      } catch (err) {
        console.error('Lỗi enrichGeometry ngoài cùng:', err);
      }
    };

    enrichGeometry();
  }, [noParkingRoutes]);

  // ================== TIME TRIGGER ==================
  const [, forceUpdate] = useState(0);
  const triggerUpdate = useCallback(() => forceUpdate(x => x + 1), []);
  useScheduleTimeTriggers(noParkingRoutes, triggerUpdate, 'forbidden');

  const onRegionDidChange = async () => {
    try {
      const centerPoint = await mapRef.current?.getCenter();
      const zoomLevel = await mapRef.current?.getZoom();
      const bounds = await mapRef.current?.getVisibleBounds();
      if (centerPoint && bounds) {
        const ne = bounds[0];
        const sw = bounds[1];
        const latitudeDelta = Math.abs(ne[1] - sw[1]);
        const longitudeDelta = Math.abs(ne[0] - sw[0]);
        setRegion({
          latitude: centerPoint[1],
          longitude: centerPoint[0],
          latitudeDelta: Math.max(latitudeDelta, 0.001),
          longitudeDelta: Math.max(longitudeDelta, 0.001),
        });
      }
      if (zoomLevel !== undefined) setZoomLevel(zoomLevel);
    } catch (err) {
      console.warn('Không thể lấy tâm, zoom hoặc bounds bản đồ:', err);
    }
  };

  useEffect(() => {
    if (
      location &&
      (!userLocation ||
        location.latitude !== userLocation.latitude ||
        location.longitude !== userLocation.longitude)
    ) {
      setUserLocation(location);
    }
  }, [location]);

  const handleRegionChange = (feature: any) => {
    const minDelta = 0.001;
    const clamped = {
      latitude: feature.properties.center[1],
      longitude: feature.properties.center[0],
      latitudeDelta: Math.max(
        feature.properties.bounds.ne[1] - feature.properties.bounds.sw[1],
        minDelta,
      ),
      longitudeDelta: Math.max(
        feature.properties.bounds.ne[0] - feature.properties.bounds.sw[0],
        minDelta,
      ),
    };
    setRegion(clamped);
    setZoomLevel(feature.properties.zoom);
  };

  // ================== USER LOCATION & CẢNH BÁO ==================
  const [showWarning, setShowWarning] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Kết nối hook theo dõi tuyến cấm
  useForbiddenRouteWatcher({
    userLocation: location,
    onEnterZone: route => {
      setRoutes(route);
      console.log('Tên tuyến: ', route.street);
      console.log('Vào tuyến cấm:', route.no_parking_route_id);
      setShowWarning(true);
    },
    onExitZone: () => {
      setRoutes(null);
      setShowWarning(false);
    },
  });

  // Khi vừa vào tuyến cấm → hiển thị banner
  useEffect(() => {
    if (!routes) {
      setShowBanner(false);
      setShowBadge(false);
      setShowModal(false);
      return;
    }

    // Khi có tuyến mới → hiện banner
    Vibration.vibrate(300);
    setShowBanner(true);
    setShowBadge(false);

    // Ẩn banner sau 5s → hiện badge
    const timer = setTimeout(() => {
      setShowBanner(false);
      setShowBadge(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [routes]);

  // Hiệu ứng fade banner
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: showBanner ? 1 : 0,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [showBanner]);

  // Hiệu ứng pulse badge
  useEffect(() => {
    if (!showBadge) return;
    Animated.loop(
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
    ).start();
  }, [showBadge]);
  // ====== HÀM KIỂM TRA NGƯỜI DÙNG CÓ Ở GẦN TUYẾN CẤM KHÔNG ======
  function isNearForbiddenRoute(
    userLoc: { latitude: number; longitude: number },
    route: any,
  ) {
    if (!route.route?.coordinates) return false;

    for (const [lon, lat] of route.route.coordinates) {
      const distance = haversine(
        { latitude: lat, longitude: lon },
        { latitude: userLoc.latitude, longitude: userLoc.longitude },
      );

      // Nếu người dùng trong phạm vi 5m của đoạn cấm
      if (distance <= 5) return true;
    }
    return false;
  }

  // ====== LẮNG NGHE THAY ĐỔI VỊ TRÍ NGƯỜI DÙNG ======
  useEffect(() => {
    if (!userLocation || !routesWithGeometry) return;
    let nearForbidden = false;
    for (const route of routesWithGeometry) {
      // Kiểm tra ngày và giờ cấm
      const now = new Date();
      if (!isDayRestricted(now, route.days_restricted)) continue;
      if (!isWithinTimeRange(now, route.time_range)) continue;
      // Kiểm tra khoảng cách
      if (isNearForbiddenRoute(userLocation, route)) {
        nearForbidden = true;
        break;
      }
    }
    if (nearForbidden && !showWarning) {
      // Nếu vừa đi vào vùng cấm, hiện banner
      setShowWarning(true);
    } else if (!nearForbidden && showWarning) {
      // Nếu vừa rời khỏi vùng cấm, ẩn banner
      setShowWarning(false);
    }
  }, [userLocation, routesWithGeometry]);

  // ================== RENDER ==================
  return (
    <View style={styles.container}>
      {/* Thanh tìm kiếm */}
      <SearchBar placeholder="Tìm bãi đỗ xe..." />

      {/* Nút chức năng */}
      <View className="absolute right-4 bottom-10 z-20 flex-col space-y-4 gap-2">
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

      {/* Modal hướng dẫn */}
      <HelpModalNoParkingRoute
        visible={showHelp}
        onClose={() => setShowHelp(false)}
      />

      {/* ================= MAP ================= */}
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
        {/* Camera */}
        <MapboxGL.Camera
          ref={cameraRef}
          defaultSettings={{
            bounds: {
              ne: [108.35, 16.15],
              sw: [107.95, 15.85],
            },
          }}
          zoomLevel={10}
        />

        {/* Vị trí người dùng */}
        {/* <MapboxGL.UserLocation
          visible={true}
          showsUserHeadingIndicator={true}
          onUpdate={handleUserLocationUpdate}
        /> */}
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

        {/* ================= ROUTES (clustered) ================= */}
        {routesWithGeometry?.map(route => {
          if (!route.route) return null;

          const now = new Date();
          if (!isDayRestricted(now, route.days_restricted)) return null;
          if (!isWithinTimeRange(now, route.time_range)) return null;

          const style = getPolylineStyleOfRoute(route);
          const coords = route.route.coordinates.map(([lon, lat]) => [
            lon,
            lat,
          ]);

          return (
            <MapboxGL.ShapeSource
              key={`route-${route.no_parking_route_id}`}
              id={`route-${route.no_parking_route_id}`}
              shape={{
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: coords },
                properties: {},
              }}
              onPress={() => setSelectedRoute(route)}
            >
              <MapboxGL.LineLayer
                id={`line-${route.no_parking_route_id}`}
                style={{
                  lineColor: style.strokeColor,
                  lineWidth: style.strokeWidth,
                  lineCap: 'round',
                }}
              />
            </MapboxGL.ShapeSource>
          );
        })}
      </MapboxGL.MapView>

      {/* ================= LOADING + ERROR ================= */}
      {noParkingRoutesLoad && (
        <ActivityIndicator
          size="large"
          color={Colors.blue_button}
          className="absolute top-32 self-center z-20"
        />
      )}

      {noParkingRoutesError && (
        <Text className="absolute bottom-10 self-center z-20 text-red-600 bg-white/90 px-3 py-1 rounded-lg font-medium">
          Không thể tải dữ liệu tuyến đường cấm đỗ xe
        </Text>
      )}

      {/* ================= MODAL CHI TIẾT ================= */}
      <NoParkingRouteModal
        route={selectedRoute}
        onClose={() => setSelectedRoute(null)}
      />
      {/* ===== Banner lớn ===== */}
      {showBanner && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 75,
            right: 15,
            alignSelf: 'center',
            width: '85%',
            backgroundColor: Colors.warning,
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
            padding: 10,
            opacity: fadeAnim,
            zIndex: 999,
            shadowOpacity: 0.4,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 4,
          }}
        >
          <Image
            source={icons.iconParkingSpot}
            style={{ width: 24, height: 24, marginRight: 10 }}
            resizeMode="contain"
          />
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>
              🚫 Bạn đang đi vào tuyến đường cấm đỗ xe!
            </Text>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
              {routes?.street}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* ===== Badge nhỏ ===== */}
      {showBadge && (
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
          <Pressable onPress={() => setShowModal(true)}>
            <IconQuestion color="white" size={24} />
          </Pressable>
        </Animated.View>
      )}

      {/* ===== Modal chi tiết ===== */}
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
            <Text 
            style={{ 
              marginTop: 8, 
              fontWeight: '600' 
              }}>
              {routes?.street}
            </Text>
            {/* <Text>Thời gian: {routes?.time_range}</Text> */}
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
              <Text style={{
                textAlign: 'center',
                fontWeight: '500',
                fontSize: 16,
              }}>
                Đã hiểu
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default NoParkingRoute;

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});
