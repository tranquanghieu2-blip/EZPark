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
import MapboxGL from '@rnmapbox/maps';
// ================= Components =================
import CircleButton from '@/components/CircleButton';
import { IconCrosshairs, IconQuestion, IconRain } from '@/components/Icons';
import SearchBar from '@/components/SearchBar';
// ================= Constants =================
import Colors from '@/constants/colors';
import { icons } from '@/constants/icons';
import { daNangRegion } from '@/constants/mapBounds';
// ================= Modals =================
import FloodReportModal from '@/modals/FloodReportModal';
import { HelpModalParkingSpot } from '@/modals/HelpModal';
import ParkingSpotDetailModal from '../../modals/ParkingSpotModal';
// import ConfirmParkingRoutes from '../../modals/ConfirmParkingRoutes';
// ================= Custom hooks =================
import { useScheduleTimeTriggers } from '@/hooks/useScheduleTimeTriggers';
import { useNavigation } from '@react-navigation/native';
import useFetch from '../../hooks/useFetch';
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

import { Point } from 'geojson';
// ================= Component =================
const ParkingSpot = () => {
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
    { latitude: number; longitude: number }[]
  >([]);
  const [showDetail, setShowDetail] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<NoParkingRoute | null>(
    null,
  );

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

  // === Khi có vị trí người dùng từ Mapbox.UserLocation ===
  const handleUserLocationUpdate = (location: any) => {
    const { coords } = location;
    if (coords) {
      setUserLocation({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
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
        {/* <CircleButton
          icon={<IconQuestion size={20} color={Colors.blue_button} />}
          bgColor="#fff"
          onPress={() => startRepeatingNotification()}
        /> */}
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
                zoomLevel: 16,
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
        compassEnabled={true}
        logoEnabled={false}
        zoomEnabled={true}
        scrollEnabled={true}
        pitchEnabled={true}
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

        {/* Vị trí người dùng */}
        <MapboxGL.UserLocation
          visible={true}
          showsUserHeadingIndicator={true}
          minDisplacement={3} // chỉ cập nhật khi di chuyển ít nhất 3 mét
          onUpdate={handleUserLocationUpdate}
        />

        {/* No Parking Routes */}
        {clusterPolylines(noParkingRoutes || [], region.longitudeDelta / 5).map(
          route => {
            const now = new Date();
            if (isDayRestricted(now, route.days_restricted)) {
              if (isWithinTimeRange(now, route.time_range)) return null;
            }
            const coords = route.route.coordinates.map(([lon, lat]) => [
              lon,
              lat,
            ]);
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
                    r => r.no_parking_route_id === routeId,
                  );

                  if (selectedRoute) setSelectedRoute(routeId.id);
                  setShowDetail(true);
                }}
              >
                <MapboxGL.LineLayer
                  id={`npr-layer-${route.no_parking_route_id}`}
                  style={{ lineColor: 'green', lineWidth: 4 }}
                />
              </MapboxGL.ShapeSource>
            );
          },
        )}

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
      const coordinates = feature.geometry.coordinates as [number, number];

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
    setShowDetail(true);
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
                iconSize: 0.5,
                iconAllowOverlap: true,
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
                  12, // default
                  10,
                  18,
                  50,
                  24,
                  100,
                ],
                circleOpacity: 1,
                circleStrokeColor: '#000',
                circleStrokeWidth: 1,
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

      <ParkingSpotDetailModal
        visible={showDetail}
        onClose={() => setShowDetail(false)}
        loading={parkingSpotDetailLoad}
        error={parkingSpotsErrorr}
        detail={parkingSpotDetail}
        currentLocation={userLocation}
        onRouteFound={coords => setRouteCoords(coords)}
      />

      <FloodReportModal
        visible={showReport}
        onClose={() => setShowReport(false)}
        onSubmit={() => {
          console.log('Đã gửi báo cáo');
          setShowReport(false);
        }}
      />
      {/* <ConfirmParkingRoutes
        route={selectedRoute}
        onClose={() => setSelectedRoute(null)}
      /> */}
    </View>
  );
};

export default ParkingSpot;

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});
