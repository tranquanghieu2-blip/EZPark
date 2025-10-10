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
} from "react-native";
import MapboxGL, { UserLocation } from "@rnmapbox/maps";
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
// ================= Utils =================
import { clusterPolylines } from "@/utils/clusterPolylines";
import { isDayRestricted, isWithinTimeRange } from "@/utils/validation";

MapboxGL.setAccessToken("sk.eyJ1IjoiaGlldWRldiIsImEiOiJjbWdpdjdsenAwYzA3MmpyNGNuOWR6czM0In0.v4WG4w0POwNCmA1UjDNAOQ");

// ================= Component =================
const ParkingSpot = () => {
  console.log('Render Parking Spot');

  const mapRef = useRef<MapboxGL.MapView>(null);
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const navigation = useNavigation<any>();

  const [region, setRegion] = useState(daNangRegion);
  // const [zoomLevel, setZoomLevel] = useState(15);
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
  const {
    data: noParkingRoutes,
    loading: noParkingRoutesLoad,
    error: noParkingRoutesError,
  } = useFetch<NoParkingRoute[]>(fetchNoParkingRoutes);

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
        placeholder="Tìm bãi đỗ xe...1111111"
        onPress={() => {
          navigation.navigate("SearchParkingSpot");
        }}

      />

      {/* Nút nổi */}
      <View className="absolute right-4 bottom-10 z-20 flex-col space-y-4 gap-3">
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
      >
        <MapboxGL.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: [daNangRegion.longitude, daNangRegion.latitude],
            zoomLevel: 10,
          }}
        />

        {/* Hiển thị vị trí người dùng */}
        <MapboxGL.UserLocation
          visible={true}
          showsUserHeadingIndicator={true}
          onUpdate={handleUserLocationUpdate}
        />

        {/* Đường đi từ modal (Polyline) */}
        {routeCoords.length > 0 && (
          <MapboxGL.ShapeSource
            id="route-line"
            shape={{
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: routeCoords.map(c => [c.longitude, c.latitude]),
              },
              properties: {},
            }}
          >
            <MapboxGL.LineLayer
              id="route-layer"
              style={{ lineColor: '#1a4349ff', lineWidth: 6 }}
            />
          </MapboxGL.ShapeSource>
        )}

        {/* Parking Spots */}
        {parkingSpots?.map(spot => (
          <MapboxGL.PointAnnotation
            key={`spot-${spot.parking_spot_id}`}
            id={`spot-${spot.parking_spot_id}`}
            coordinate={[spot.longitude, spot.latitude]}
            onSelected={() => {
              setSelectedId(spot.parking_spot_id);
              setShowDetail(true);
            }}
          >
            <Image
              source={icons.iconParkingSpot}
              style={{ width: 35, height: 35 }}
              resizeMode="contain"
            />
          </MapboxGL.PointAnnotation>
        ))}

        {/* No Parking Routes */}
        {clusterPolylines(
          noParkingRoutes || [],
          region.longitudeDelta / 5,
        ).map(route => {
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
                properties: {},
              }}
            >
              <MapboxGL.LineLayer
                id={`npr-layer-${route.no_parking_route_id}`}
                style={{ lineColor: 'green', lineWidth: 4 }}
              />
            </MapboxGL.ShapeSource>
          );
        })}
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
    </View>
  );
};

export default ParkingSpot;

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});
