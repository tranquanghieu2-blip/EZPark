// ================= Thông dụng =================
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import MapView from "react-native-map-clustering";
import { Marker, Polyline, Region, UrlTile } from "react-native-maps";
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

const NoParkingRoute = () => {
  console.log("Render No Parking Route");

  // ================= Khai báo các hook =================
  const [region, setRegion] = useState<Region>(daNangRegion);
  const [zoomLevel, setZoomLevel] = useState(20);
  const mapRef = useRef<MapView | null>(null);

  const [showHelp, setShowHelp] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<NoParkingRoute | null>(null);

  const { signals } = useTraffic();

  // Fetch No Parking Route
  const {
    data: noParkingRoutes,
    loading: noParkingRoutesLoad,
    error: noParkingRoutesError,
  } = useFetch<NoParkingRoute[]>(fetchNoParkingRoutes);

  // Dùng service routing để tính toán geometry
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

  // Trigger thời gian cấm
  const [, forceUpdate] = useState(0);
  const triggerUpdate = useCallback(() => forceUpdate((x) => x + 1), []);
  useScheduleTimeTriggers(noParkingRoutes, triggerUpdate, "forbidden");

  // Hàm tính zoom level
  const getZoomLevel = (r: Region) => {
    const angle = r.longitudeDelta;
    return Math.round(Math.log(360 / angle) / Math.LN2);
  };

  // Xử lý khi thay đổi region (nhưng không controlled map)
  const handleRegionChange = (r: Region) => {
    const minDelta = 0.001;
    const clamped = {
      ...r,
      latitudeDelta: Math.max(r.latitudeDelta, minDelta),
      longitudeDelta: Math.max(r.longitudeDelta, minDelta),
    };
    setRegion(clamped); // update để clustering re-render
    setZoomLevel(getZoomLevel(clamped));
  };

  return (
    <View style={styles.container}>
      
      <SearchBar placeholder="Tìm bãi đỗ xe..." />

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
            // ví dụ: focus về Đà Nẵng
            // mapRef.current?.animateToRegion(daNangRegion, 500);
          }}
        />
      </View>

      <HelpModalNoParkingRoute
        visible={showHelp}
        onClose={() => setShowHelp(false)}
      />

      <MapView
        provider={null as any} // ⚠️ Rất quan trọng: tắt Google provider để chỉ dùng tile
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={daNangRegion} // chỉ dùng initialRegion
        onRegionChangeComplete={handleRegionChange} // không loop render
        
        renderCluster={(cluster) => {
          const { id, geometry, onPress, properties } = cluster;
          const pointCount = properties.point_count;
          return (
            
            <Marker
              key={`cluster-${id}`}
              coordinate={{
                latitude: geometry.coordinates[1],
                longitude: geometry.coordinates[0],
              }}
              onPress={onPress}
              tracksViewChanges={false}
            >
              <View
                style={{
                  width: 25,
                  height: 25,
                  borderRadius: 15,
                  backgroundColor: "#6a2121ff",
                  justifyContent: "center",
                  alignItems: "center",
                  borderWidth: 3,
                  borderColor: "white",
                }}
              >
                <Text style={{ color: "white", fontWeight: "medium" }}>
                  {pointCount}
                </Text>
              </View>
            </Marker>
          );
        }}
        
      >

        {/* OSM tiles */}
        <UrlTile urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={15} />
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
          const coordinates = route.route.coordinates.map(([lon, lat]) => ({
            latitude: lat,
            longitude: lon,
          }));

          return (
            <Polyline
              key={route.no_parking_route_id}
              coordinates={coordinates}
              strokeWidth={style.strokeWidth}
              strokeColor={style.strokeColor}
              tappable
              onPress={() => {
                console.log("Polyline được click:", route.no_parking_route_id);
                setSelectedRoute(route);
              }}
            />
          );
        })}
        {signals?.map((s, i) => (
          <Marker
            key={`signal-${s.id ?? i}`}
            coordinate={{ latitude: s.lat, longitude: s.lon }}
            title="Đèn giao thông"
          >
            <Image
              source={icons.trafficLights}
              style={{
                width: 30,
                height: 30,
              }}
              resizeMode="contain"
            />
          </Marker>
        ))}

      </MapView>

      {noParkingRoutesLoad && (
        <ActivityIndicator
          size="large"
          color={Colors.blue_button}
          className="absolute top-32 self-center z-20"
        />
      )}

      {noParkingRoutesError ? (
        <Text className="absolute bottom-10 self-center z-20 text-red-600 bg-white/90 px-3 py-1 rounded-lg font-medium">
          Không thể tải dữ liệu tuyến đường cấm đỗ xe
        </Text>
      ) : null}

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
