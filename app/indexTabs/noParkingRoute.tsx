import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import MapboxGL from "@rnmapbox/maps";
// ================= Components =================
import CircleButton from "@/components/CircleButton";
import { IconCrosshairs, IconQuestion } from "@/components/Icons";
import SearchBar from "@/components/SearchBar";
// ================= Constants =================
import Colors from "@/constants/colors";
import { icons } from "@/constants/icons";
import { DA_NANG_CENTER, DA_NANG_BBOX } from "@/constants/danangMap";
// ================= Custom hooks =================
import useFetch from "@/hooks/useFetch";
import { useScheduleTimeTriggers } from "@/hooks/useScheduleTimeTriggers";
// ================= Services =================
import {
  fetchNoParkingRoutes,
  updateNoParkingRouteGeometry,
} from "@/service/api";
import { getRoute } from "@/service/routingService";
// ================= Utils =================
import { clusterPolylines } from "@/utils/clusterPolylines";
import { getPolylineStyleOfRoute } from "@/utils/polylineStyle";
import { isDayRestricted, isWithinTimeRange } from "@/utils/validation";
// ================= Modals =================
import { HelpModalNoParkingRoute } from "@/modals/HelpModal";
import NoParkingRouteModal from "@/modals/NoParkingRouteModal";

MapboxGL.setAccessToken(
  "sk.eyJ1IjoiaGlldWRldiIsImEiOiJjbWdpdjdsenAwYzA3MmpyNGNuOWR6czM0In0.v4WG4w0POwNCmA1UjDNAOQ"
);

const NoParkingRoute = () => {
  console.log("Render No Parking Route");

  // ================== STATE ==================
  const [center, setCenter] = useState<{ latitude: number; longitude: number }>(DA_NANG_CENTER);

  const [zoom, setZoom] = useState(12);
  const [selectedRoute, setSelectedRoute] = useState<NoParkingRoute | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [routesWithGeometry, setRoutesWithGeometry] = useState<NoParkingRoute[] | null>(null);

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
          noParkingRoutes.map(async (route) => {
            if (route.route) return route;
            try {
              const routeData = await getRoute(route.location_begin, route.location_end);
              if (routeData?.geometry) {
                const geometry = routeData.geometry;
                await updateNoParkingRouteGeometry(route.no_parking_route_id, geometry);
                return { ...route, geometry };
              } else {
                console.warn(`Không có geometry cho route: ${route.no_parking_route_id}`);
                return route;
              }
            } catch (err) {
              console.error("Lỗi tính polyline cho route:", route.no_parking_route_id, err);
              return route;
            }
          })
        );
        setRoutesWithGeometry(updatedRoutes);
      } catch (err) {
        console.error("Lỗi enrichGeometry ngoài cùng:", err);
      }
    };

    enrichGeometry();
  }, [noParkingRoutes]);

  // ================== TIME TRIGGER ==================
  const [, forceUpdate] = useState(0);
  const triggerUpdate = useCallback(() => forceUpdate((x) => x + 1), []);
  useScheduleTimeTriggers(noParkingRoutes, triggerUpdate, "forbidden");

  // ================== MAP EVENTS ==================
  const onRegionDidChange = async () => {
    try {
      const centerPoint = await mapRef.current?.getCenter();
      const zoomLevel = await mapRef.current?.getZoom();

      if (centerPoint) {
        setCenter({
          longitude: centerPoint[0],
          latitude: centerPoint[1],
        });
      }
      if (zoomLevel !== undefined) setZoom(zoomLevel);
    } catch (err) {
      console.warn("Không thể lấy tâm hoặc zoom bản đồ:", err);
    }
  };

  // ================== CLUSTERED ROUTES ==================


  // ================== RENDER ==================
  return (
    <View style={styles.container}>
      {/* Thanh tìm kiếm */}
      <SearchBar placeholder="Tìm bãi đỗ xe..." />

      {/* Nút chức năng */}
      <View className="absolute right-4 bottom-10 z-20 flex-col space-y-4 gap-2">
        <CircleButton
          icon={<IconQuestion size={20} color={Colors.blue_button} />}
          bgColor="#fff"
          onPress={() => setShowHelp(true)}
        />
        <CircleButton
          icon={<IconCrosshairs size={20} color={Colors.blue_button} />}
          bgColor="#fff"
          onPress={() => {
            cameraRef.current?.fitBounds(
              DA_NANG_BBOX[0],
              DA_NANG_BBOX[1],
              [40, 40, 40, 40],
              800
            );
          }}
        />
      </View>

      {/* Modal hướng dẫn */}
      <HelpModalNoParkingRoute visible={showHelp} onClose={() => setShowHelp(false)} />

      {/* ================= MAP ================= */}
      <MapboxGL.MapView
        ref={mapRef}
        style={styles.map}
        styleURL={MapboxGL.StyleURL.Street}
        onMapIdle={(feature) => {
          console.log("Map idle:", feature);
        }}
        zoomEnabled
        scrollEnabled
        pitchEnabled
        rotateEnabled
        compassEnabled
      >
        {/* Camera */}
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={12}
          centerCoordinate={[DA_NANG_CENTER.longitude, DA_NANG_CENTER.latitude]}
          bounds={{
            ne: DA_NANG_BBOX[1],
            sw: DA_NANG_BBOX[0],
          }}
        />

        {/* Vị trí người dùng */}
        <MapboxGL.UserLocation visible={true} showsUserHeadingIndicator={true} />

        {/* ================= ROUTES (clustered) ================= */}
        {clusterPolylines(
          routesWithGeometry || [],
          zoom).map((route) => {
            if (!route.route) return null;

            const now = new Date();
            if (!isDayRestricted(now, route.days_restricted)) return null;
            if (!isWithinTimeRange(now, route.time_range)) return null;

            const style = getPolylineStyleOfRoute(route);
            const coords = route.route.coordinates.map(([lon, lat]) => [lon, lat]);

            return (
              <MapboxGL.ShapeSource
                key={`route-${route.no_parking_route_id}`}
                id={`route-${route.no_parking_route_id}`}
                shape={{
                  type: "Feature",
                  geometry: { type: "LineString", coordinates: coords },
                  properties: {},
                }}
                onPress={() => setSelectedRoute(route)}
              >
                <MapboxGL.LineLayer
                  id={`line-${route.no_parking_route_id}`}
                  style={{
                    lineColor: style.strokeColor,
                    lineWidth: style.strokeWidth,
                    lineCap: "round",
                  }}
                />
              </MapboxGL.ShapeSource>
            );
          })}

        {/* Marker đèn giao thông */}
        {/* {signals?.map((s, i) => (
          <MapboxGL.PointAnnotation
            key={`signal-${s.id ?? i}`}
            id={`signal-${s.id ?? i}`}
            coordinate={[s.lon, s.lat]}
          >
            <Image
              source={icons.trafficLights}
              style={{ width: 30, height: 30 }}
              resizeMode="contain"
            />
          </MapboxGL.PointAnnotation>
        ))} */}
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
      <NoParkingRouteModal route={selectedRoute} onClose={() => setSelectedRoute(null)} />
    </View>
  );
};

export default NoParkingRoute;

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});
