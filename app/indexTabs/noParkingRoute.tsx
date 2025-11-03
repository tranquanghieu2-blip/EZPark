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
import { DA_NANG_CENTER, DA_NANG_VIEWPORT } from "@/constants/danangMap";
// ================= Custom hooks =================
import useFetch from "@/hooks/useFetch";
import { useScheduleTimeTriggers } from "@/hooks/useScheduleTimeTriggers";
// ================= Services =================
import {
  fetchNoParkingRoutes,
  updateNoParkingRouteGeometry,
} from "@/service/api";
import { getRoutes } from "@/service/routingService";
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
  const [region, setRegion] = useState<{ latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number }>(DA_NANG_VIEWPORT);
  const [zoomLevel, setZoomLevel] = useState(12);
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
              const routeData = await getRoutes(route.location_begin, route.location_end);
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
  // const onRegionDidChange = async () => {
  //   try {
  //     const centerPoint = await mapRef.current?.getCenter();
  //     const zoomLevel = await mapRef.current?.getZoom();

  //     if (centerPoint) {
  //       setCenter({
  //         longitude: centerPoint[0],
  //         latitude: centerPoint[1],
  //       });
  //     }
  //     if (zoomLevel !== undefined) setZoom(zoomLevel);
  //   } catch (err) {
  //     console.warn("Không thể lấy tâm hoặc zoom bản đồ:", err);
  //   }
  // };

  // const handleRegionChange = (feature) => {
  //   const minDelta = 0.001;
  //   const clamped = {
  //     feature.properties.center[1],

  //   };
  //   setRegion(clamped); // update để clustering re-render
  //   setZoomLevel(feature.properties.zoomLevel);

  // };

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
      console.warn("Không thể lấy tâm, zoom hoặc bounds bản đồ:", err);
    }
  };



  const handleRegionChange = (feature: any) => {
    const minDelta = 0.001;
    const clamped = {
      latitude: feature.properties.center[1],
      longitude: feature.properties.center[0],
      latitudeDelta: Math.max(feature.properties.bounds.ne[1] - feature.properties.bounds.sw[1], minDelta),
      longitudeDelta: Math.max(feature.properties.bounds.ne[0] - feature.properties.bounds.sw[0], minDelta),
    };
    setRegion(clamped);
    setZoomLevel(feature.properties.zoom);
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
        // onMapIdle={(feature) => {
        //   console.log("Map is idle", feature);
        //   handleRegionChange(feature);
        // }}
        // onRegionDidChange={onRegionDidChange}
        zoomEnabled
        scrollEnabled
        pitchEnabled
        rotateEnabled
        compassEnabled
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
        <MapboxGL.UserLocation visible={true} showsUserHeadingIndicator={true} />

        {/* ================= ROUTES (clustered) ================= */}
        {
          
            routesWithGeometry?.map((route) => {
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
