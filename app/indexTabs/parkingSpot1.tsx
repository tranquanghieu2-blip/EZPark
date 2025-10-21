// ================= Thông dụng =================
import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  View,
  PermissionsAndroid,
  Platform,
} from 'react-native';
// @ts-ignore
import MapboxGL from '@rnmapbox/maps';

// ================= Components =================
import CircleButton from '@/components/CircleButton';
import { IconCrosshairs, IconQuestion, IconRain, IconCancelRouting } from '@/components/Icons';
import SearchBar from '@/components/SearchBar';
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
import { useNavigation } from '@react-navigation/native';
import useFetch from '../../hooks/useFetch';
import { useSmartMapboxLocation } from '@/hooks/usePeriodicMapboxLocation';

// ================= Services =================
import {
  fetchNoParkingRoutes,
  fetchParkingSpotDetail,
  fetchParkingSpots,
} from '../../service/api';

// import { startRepeatingNotification } from '@/service/testNoti';
// ================= Utils =================
import { clusterPolylines } from '@/utils/clusterPolylines';
import { isDayRestricted, isWithinTimeRange } from '@/utils/validation';
import { NativeModules } from 'react-native';
import messaging from '@react-native-firebase/messaging';

import { Point } from 'geojson';
import DeviceInfo from 'react-native-device-info';
// ================= Component =================
const ParkingSpot = () => {
  const location = useSmartMapboxLocation();
  // console.log('Location: ', location);
  // const fcmToken = messaging().getToken();
  // console.log('FCM Token:', fcmToken);
  // const deviceId = DeviceInfo.getUniqueId();
  // console.log('Device ID:', deviceId);
  console.log('Render Parking Spot');
  const shapeSourceRef = useRef<MapboxGL.ShapeSource>(null);
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const navigation = useNavigation();
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

   useEffect(() => {
  if (location) {
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
  const fetchDetail = useCallback(() => {
    if (selectedId == null) return Promise.reject(new Error('No selectedId'));
    return fetchParkingSpotDetail(selectedId);
  }, [selectedId]);

  const {
    data: parkingSpotDetail,
    loading: parkingSpotDetailLoad,
    error: parkingSpotsErrorr,
  } = useFetch<ParkingSpotDetail>(selectedId ? fetchDetail : null, true, [
    selectedId,
  ]);

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
          latitude: center[1],
          longitude: center[0],
        });
      }
    } catch (error) {
      console.warn('Không thể lấy tâm bản đồ:', error);
    }
  };

  return (
    <View style={styles.container}>
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
            }}
          />
        )}
        
        <CircleButton
          icon={<IconRain size={20} color={Colors.blue_button} />}
          bgColor="#fff"
          onPress={() => setShowReport(true)}
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
        <MapboxGL.UserLocation
          visible={true}
          showsUserHeadingIndicator={false}
          minDisplacement={5} // chỉ cập nhật khi di chuyển ít nhất 5 mét
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
              }
            }}
          >
            {/* ảnh icon */}
            <MapboxGL.Images images={{ parkingIcon: icons.iconParkingSpot }} />

            {/* Marker riêng lẻ */}
            <MapboxGL.SymbolLayer
              id="unclustered-point"
              filter={['!', ['has', 'point_count']]}
              style={{
                iconImage: 'parkingIcon',
                iconSize: 0.6,
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
        visible={showParkingDetail}
        onClose={() => setShowParkingDetail(false)}
        loading={parkingSpotDetailLoad}
        error={parkingSpotsErrorr}
        detail={parkingSpotDetail}
        currentLocation={userLocation}
        onRouteFound={coords => {
          setRouteCoords(coords);
        }}
        
      />

      {/* Modal cho Flood Report */}
      <FloodReportModal
        visible={showReport}
        onClose={() => setShowReport(false)}
        onSubmit={() => {
          console.log('Đã gửi báo cáo');
          setShowReport(false);
        }}
      />

      {/* Modal cho Route Confirmation */}
      {selectedRoute && (
        <ConfirmParkingRoutesModal
          route={selectedRoute}
          onClose={() => {
            setSelectedRoute(null);
            setShowRouteConfirm(false);
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
