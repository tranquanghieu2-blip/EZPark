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
// Components
import CircleButton from '@/components/CircleButton';
import { IconCrosshairs, IconQuestion, IconWarning } from '@/components/Icons';
import SearchBar from '@/components/SearchBar';
// Constants
import Colors from '@/constants/colors';
// Custom hooks
import useFetch from '@/hooks/useFetch';
import { useScheduleTimeTriggers } from '@/hooks/useScheduleTimeTriggers';
// Services
import {
  fetchNoParkingRoutes,
  updateNoParkingRouteGeometry,
} from '@/service/api';
import { getRoutes } from '@/service/routingService';
// Utils
import { getPolylineStyleOfRoute } from '@/utils/polylineStyle';
import { isDayRestricted, isWithinTimeRange } from '@/utils/validation';
// Modals
import { HelpModalNoParkingRoute } from '@/modals/HelpModal';
import NoParkingRouteModal from '@/modals/NoParkingRouteModal';
import { images } from '@/constants/images';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Animated } from 'react-native';
import { useForbiddenRouteWatcher } from '@/hooks/useForbiddenRouteWatcher';
import { useSmartMapboxLocation } from '@/hooks/usePeriodicMapboxLocation';
import { mapEvents } from '@/utils/eventEmitter';
import {
  EVENT_FORBIDDEN_ROUTE_ENTER,
  EVENT_FORBIDDEN_ROUTE_EXIT,
} from '@/utils/eventEmitter';

const NoParkingRoute = () => {
  const location = useSmartMapboxLocation();
  console.log('Render No Parking Route');
  const navigation = useNavigation<any>();
  const routeNav = useRoute<any>();

  const [currentForbiddenRoute, setCurrentForbiddenRoute] =
    useState<NoParkingRoute | null>(null);
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

  const mapRef = useRef<MapboxGL.MapView>(null);
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const {
    data: noParkingRoutes,
    loading: noParkingRoutesLoad,
    error: noParkingRoutesError,
  } = useFetch<NoParkingRoute[]>(fetchNoParkingRoutes);

  useEffect(() => {
    const id = routeNav?.params?.selectedNoParkingRouteId;
    if (!id || !routesWithGeometry) return;

    const found = routesWithGeometry.find(r => r.no_parking_route_id === id);
    if (!found) return;

    // Set selected route để mở modal
    setSelectedRoute(found);
    // Zoom gần vào tuyến
    if (found?.route?.coordinates?.length) {
      const mid = Math.floor(found.route.coordinates.length / 2);
      const [lon, lat] = found.route.coordinates[mid];

      cameraRef.current?.setCamera({
        centerCoordinate: [lon, lat],
        zoomLevel: 16,
        animationDuration: 800,
      });
    }

    // Clear param để không trigger lại khi re-render
    navigation.setParams({ selectedNoParkingRouteId: undefined });
  }, [routeNav?.params?.selectedNoParkingRouteId, routesWithGeometry]);

  // GEOMETRY
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

              if (routeData[0]?.geometry) {
                const geometry = routeData[0].geometry;
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

  //TIME TRIGGER
  const [, forceUpdate] = useState(0);
  const triggerUpdate = useCallback(() => forceUpdate(x => x + 1), []);
  useScheduleTimeTriggers(noParkingRoutes, triggerUpdate, 'forbidden');
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

  const [showBanner, setShowBanner] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Kết nối hook theo dõi tuyến cấm
  const check = useForbiddenRouteWatcher({
    userLocation: location,
    onEnterZone: route => {
      setCurrentForbiddenRoute(route);
      console.log('ĐÃ VÀO TUYẾN CẤM:', route.street);

      // emit event để các màn hình khác biết
      mapEvents.emit(EVENT_FORBIDDEN_ROUTE_ENTER, route);
    },
    onExitZone: () => {
      setCurrentForbiddenRoute(null);
      console.log('ĐÃ RA KHỎI TUYẾN CẤM');

      // emit exit
      mapEvents.emit(EVENT_FORBIDDEN_ROUTE_EXIT);
    },
  });
  console.log('Check forbidden route:', check);
  // Khi vừa vào tuyến cấm  hiển thị banner
  useEffect(() => {
    console.log('Tuyến cấm hiện tại: ',currentForbiddenRoute?.street || 'Không có',);
    if (!currentForbiddenRoute) {
      setShowBanner(false);
      setShowBadge(false);
      setShowModal(false);
      return;
    }
    // Khi có tuyến mới
    Vibration.vibrate(300); //rung
    setShowBanner(true);
    setShowBadge(false);

    // Ẩn banner sau 7s
    const timer = setTimeout(() => {
      setShowBanner(false);
      setShowBadge(true);
    }, 7000);

    return () => clearTimeout(timer);
  }, [currentForbiddenRoute]);

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

  return (
    <View style={styles.container}>
      {/* Thanh tìm kiếm */}
      <SearchBar
        placeholder="Tìm tuyến cấm đỗ xe..."
        onPress={() => navigation.navigate('SearchNoParkingRoute' as never)}
      />

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

      {/* MAP */}
      <MapboxGL.MapView
        ref={mapRef}
        style={styles.map}
        styleURL={MapboxGL.StyleURL.Street}
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

        {/* ROUTES */}
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

          const isSelected =
            selectedRoute?.no_parking_route_id === route.no_parking_route_id;
          return (
            <MapboxGL.ShapeSource
              key={`route-${route.no_parking_route_id}`}
              id={`route-${route.no_parking_route_id}`}
              shape={{
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: coords },
                properties: {},
              }}
              onPress={() => {
                setSelectedRoute(route);
                if (route?.route?.coordinates?.length) {
                  const coords = route.route.coordinates;
                  const midIndex = Math.floor(coords.length / 2);
                  const [lon, lat] = coords[midIndex];

                  cameraRef.current?.setCamera({
                    centerCoordinate: [lon, lat],
                    zoomLevel: 14, 
                    animationDuration: 700,
                  });
                }
              }}
            >
              <MapboxGL.LineLayer
                id={`line-${route.no_parking_route_id}`}
                style={{
                  lineColor: style.strokeColor,
                  lineCap: 'round',
                  lineWidth: isSelected ? 6 : 4, 
                  lineOpacity: isSelected ? 0.9 : 0.8,
                }}
              />
            </MapboxGL.ShapeSource>
          );
        })}
      </MapboxGL.MapView>

      {/* LOADING + ERROR */}
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

      {/* MODAL CHI TIẾT */}
      <NoParkingRouteModal
        route={selectedRoute}
        onClose={() => setSelectedRoute(null)}
      />
      {/*Banner lớn */}
      {showBanner && (
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
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>
             <IconWarning color="red" size={22} />Bạn đang đi vào tuyến đường cấm đỗ xe!
            </Text>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>
              Tuyến: {currentForbiddenRoute?.street}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Badge nhỏ*/}
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
            <IconWarning color="white" size={24} />
          </Pressable>
        </Animated.View>
      )}

      {/*Modal chi tiết*/}
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
               Bạn đang di chuyển trên tuyến cấm đỗ
            </Text>
            <Text
              style={{
                marginTop: 8,
                fontWeight: '700',
                fontSize: 20,
              }}
            >
              Tuyến: {currentForbiddenRoute?.street}
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
              <Text
                style={{
                  textAlign: 'center',
                  fontWeight: '500',
                  fontSize: 16,
                }}
              >
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
