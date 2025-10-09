// ================= Thông dụng =================
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
import { daNangRegion } from "@/constants/mapBounds";
// ================= Custom hooks =================
import useFetch from "@/hooks/useFetch";
import { useScheduleTimeTriggers } from "@/hooks/useScheduleTimeTriggers";
import { useTraffic } from "@/hooks/useTraffic";
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

// ================= Component =================
const NoParkingRoute = () => {
  console.log("Render No Parking Route");

  const [region, setRegion] = useState(daNangRegion);
  const mapRef = useRef<MapboxGL.MapView>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<NoParkingRoute | null>(null);

  const { signals } = useTraffic();

  const {
    data: noParkingRoutes,
    loading: noParkingRoutesLoad,
    error: noParkingRoutesError,
  } = useFetch<NoParkingRoute[]>(fetchNoParkingRoutes);

  const [routesWithGeometry, setRoutesWithGeometry] = useState<NoParkingRoute[] | null>(null);
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

  const [, forceUpdate] = useState(0);
  const triggerUpdate = useCallback(() => forceUpdate((x) => x + 1), []);
  useScheduleTimeTriggers(noParkingRoutes, triggerUpdate, "forbidden");

  // Khi bản đồ thay đổi
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
      console.warn("Không thể lấy tâm bản đồ:", error);
    }
  };

  return (
    <View style={styles.container}>
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
            // Focus về Đà Nẵng
          }}
        />
      </View>

      {/* Modal hướng dẫn */}
      <HelpModalNoParkingRoute
        visible={showHelp}
        onClose={() => setShowHelp(false)}
      />

      {/* Mapbox map */}
      <MapboxGL.MapView
        ref={mapRef}
        style={styles.map}
        styleURL={MapboxGL.StyleURL.Street}
        compassEnabled
        zoomEnabled
        onRegionDidChange={onRegionDidChange}
      >
        <MapboxGL.Camera
          centerCoordinate={[region.longitude, region.latitude]}
          zoomLevel={15}
        />

        {/* GPS user location */}
        <MapboxGL.UserLocation visible={true} />

        {/* Hiển thị các tuyến đường cấm đỗ */}
        {clusterPolylines(
          routesWithGeometry || [],
          region,
          region.longitudeDelta / 5
        ).map((route) => {
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
                properties: {}, // ✅ Bắt buộc có, dù trống
              }}

            >
              <MapboxGL.LineLayer
                id={`line-${route.no_parking_route_id}`}
                style={{
                  lineColor: style.strokeColor,
                  lineWidth: style.strokeWidth,
                }}

              />
            </MapboxGL.ShapeSource>
          );
        })}

        {/* Marker đèn giao thông */}
        {signals?.map((s, i) => (
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
        ))}
      </MapboxGL.MapView>

      {/* Loading + Error */}
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

      <NoParkingRouteModal
        route={selectedRoute}
        onClose={() => setSelectedRoute(null)}
      />
    </View>
  );
};

export default NoParkingRoute;

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});
