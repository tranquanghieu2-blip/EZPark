// ================= Thông dụng =================
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView from "react-native-map-clustering";
import { Marker, Polyline, Region, UrlTile } from "react-native-maps";
// ================= Components =================
import CircleButton from "@/components/CircleButton";
import { IconCrosshairs, IconQuestion, IconRain } from "@/components/Icons";
import SearchBar from "@/components/SearchBar";
// ================= Constants =================
import Colors from "@/constants/colors";
import { icons } from "@/constants/icons";
import { daNangRegion } from "@/constants/mapBounds";
// ================= Modals =================
// import ConfirmParkingModal from "@/modals/ConfirmParkingRoutes";
import FloodReportModal from "@/modals/FloodReportModal";
import { HelpModalParkingSpot } from "@/modals/HelpModal";
import ParkingSpotDetailModal from "../../modals/ParkingSpotModal";
// ================= Custom hooks =================
import { useLocation } from "@/hooks/useLocation";
import { useScheduleTimeTriggers } from "@/hooks/useScheduleTimeTriggers";
import { useNavigation } from "@react-navigation/native";
import useFetch from "../../hooks/useFetch";
// ================= Services =================
import {
  fetchNoParkingRoutes,
  fetchParkingSpotDetail,
  fetchParkingSpots,
} from "../../service/api";
// ================= Utils =================
import { clusterPolylines } from "@/utils/clusterPolylines";
import { isDayRestricted, isWithinTimeRange } from "@/utils/validation";



const ParkingSpot = () => {
  console.log("Render Parking Spot ");
  // Khai báo các hook
  const { location, error } = useLocation();
  const [myMarker, setMyMarker] = useState<{ lat: number; lon: number } | null>(
    null
  );

  const [routeCoords, setRouteCoords] = useState<
    { latitude: number; longitude: number }[]
  >([]);

  const [region, setRegion] = useState<Region>(daNangRegion);
  const mapRef = useRef<any>(null);

  const [zoomLevel, setZoomLevel] = useState(15);

  const getZoomLevel = (r: Region) => {
    const angle = r.longitudeDelta;
    return Math.round(Math.log(360 / angle) / Math.LN2);
  };

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

  // Fetch Parking Spot
  const {
    data: parkingSpots,
    loading: parkingSpotsLoad,
    error: parkingSpotsError,
  } = useFetch<ParkingSpot[]>(fetchParkingSpots);

  // Fetch Parking Spot Details
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const fetchDetail = useCallback(() => {
    // selectedId có thể null; gọi chỉ khi selectedId != null
    if (selectedId == null) {
      // return a never-resolving promise? tốt nhất là không gọi khi null
      return Promise.reject(new Error("No selectedId"));
    }
    return fetchParkingSpotDetail(selectedId);
  }, [selectedId]);

  const {
    data: parkingSpotDetail,
    loading: parkingSpotDetailLoad,
    error: parkingSpotsErrorr,
    refetch: refetchParkingSpotDetail,
  } = useFetch<ParkingSpotDetail>(selectedId ? fetchDetail : null, true, [
    selectedId,
  ]);

  // Fetch No-Parking Routes
  const {
    data: noParkingRoutes,
    loading: noParkingRoutesLoad,
    error: noParkingRoutesError,
  } = useFetch<NoParkingRoute[]>(fetchNoParkingRoutes);

  // Show các modal
  const [showDetail, setShowDetail] = useState(false);

  // const { signals } = useTraffic();

  const [showHelp, setShowHelp] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<NoParkingRoute | null>(
    null
  );

  // Trigger thời gian 
  const [, forceUpdate] = useState(0);
  const triggerUpdate = useCallback(() => forceUpdate((x) => x + 1), []);
  useScheduleTimeTriggers(noParkingRoutes, triggerUpdate, "allowed");

  // const mapStyle = [
  //   {
  //     featureType: "poi",
  //     elementType: "all",
  //     stylers: [{ visibility: "off" }], // ẩn các điểm POI
  //   },
  //   {
  //     featureType: "transit",
  //     elementType: "all",
  //     stylers: [{ visibility: "off" }], // ẩn trạm xe buýt, metro
  //   },
  //   {
  //     featureType: "road",
  //     elementType: "labels.icon",
  //     stylers: [{ visibility: "off" }], // ẩn icon đường
  //   },
  //   {
  //     featureType: "administrative",
  //     elementType: "labels.icon",
  //     stylers: [{ visibility: "off" }], // ẩn icon hành chính
  //   },
  // ];

  const navigation = useNavigation();


  return (
    <View className="flex-1 bg-white">
      {/* Thanh tìm kiếm */}
      <SearchBar 
      placeholder="Tìm bãi đỗ xe..."
      onPress={() => navigation.navigate("SearchParkingSpot" as never)} />
      {/* Nút nổi góc phải */}
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
        

        {/* Vị trí hiện tại */}
        <CircleButton
          icon={<IconCrosshairs size={20} color={Colors.blue_button} />}
          bgColor="#fff"
          onPress={() => {
            console.log("Go to my location", location);
            if (location && mapRef.current) {
              mapRef.current.animateToRegion({
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.001,
                longitudeDelta: 0.001,
              });
              // set marker
              setMyMarker({ lat: location.latitude, lon: location.longitude });
            }
          }}
        />
      </View>
      {/* Modal trợ giúp */}
      <HelpModalParkingSpot

        visible={showHelp}
        onClose={() => setShowHelp(false)}
      />

      <MapView
        provider={null as any} // ⚠️ Rất quan trọng: tắt Google provider để chỉ dùng tile
        ref={mapRef}
        style={styles.map}
        region={region}
        initialRegion={daNangRegion}
        // customMapStyle={mapStyle}
        // initialRegion={daNangRegion}
        // rotateEnabled
        // pitchEnabled
        // showsCompass
        // showsBuildings
        // onRegionChangeComplete={handleRegionChange}
        // showsUserLocation={true} // sẽ hiện chấm xanh giống gg map
        // followsUserLocation={true} //  map tự follow theo
        // showsMyLocationButton={true}
        tracksViewChanges={false}
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
            >
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 25,
                  backgroundColor: "#0e5083ff",
                  justifyContent: "center",
                  alignItems: "center",
                  borderWidth: 3,
                  borderColor: "white",
                }}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>
                  {pointCount}
                </Text>
              </View>
            </Marker>
          );
        }}
      >
        {/* OSM tiles */}
        <UrlTile urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
        maximumZ={15} />

        {/* Vẽ Polyline nếu có route */}
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor="#1a4349ff"
            strokeWidth={6}
          />
        )}

        {/* Marker của chính người dùng */}
        {myMarker && (
          <Marker
            coordinate={{ latitude: myMarker.lat, longitude: myMarker.lon }}
            title="Vị trí của tôi"
          >
            <View
              style={{
                width: 15,
                height: 15,
                borderRadius: 10,
                backgroundColor: "blue",
                borderWidth: 2,
                borderColor: "white",
              }}
            />
          </Marker>
        )}

        {/* Parking spots clustering */}
        {parkingSpots?.map((spot) => (
          <Marker
            key={spot.parking_spot_id}
            coordinate={{
              latitude: spot.latitude,
              longitude: spot.longitude,
            }}
            onPress={() => {
              setSelectedId(spot.parking_spot_id);
              setShowDetail(true);
            }}
          //props này để clustering hoạt động tốt hơn
          // tracksViewChanges={false}
          >
            <Image
              source={icons.iconParkingSpot}
              style={{
                width: 35,
                height: 35,
              }}
              resizeMode="contain"
            />
          </Marker>
        ))}

        {clusterPolylines(noParkingRoutes || [], region, region.longitudeDelta / 5).map((route) => {
          const now = new Date();

          if (isDayRestricted(now, route.days_restricted)) {
            if (isWithinTimeRange(now, route.time_range)) {
              return null;
            }
          }

          const coordinates = route.route.coordinates.map(([lon, lat]) => ({
            latitude: lat,
            longitude: lon,
          }));

          return (
            <Polyline
              key={route.no_parking_route_id}
              coordinates={coordinates}
              strokeWidth={4}
              strokeColor={"green"}
              tappable
              onPress={() => setSelectedRoute(route)}
            />
          );
        })}

      </MapView>
      {/* Loading overlay */}
      {parkingSpotsLoad && (
        <ActivityIndicator
          size="large"
          color={Colors.blue_button}
          className="absolute top-32 self-center z-20"
        />
      )}

      {/* Error overlay */}
      {parkingSpotsError ? (
        <Text className="absolute bottom-10 self-center z-20 text-red-600 bg-white/90 px-3 py-1 rounded-lg font-medium">
          Không thể tải dữ liệu bãi đỗ xe
        </Text>
      ) : null}

      {/* Modal chi tiết bãi đỗ */}
      <ParkingSpotDetailModal
        visible={showDetail}
        onClose={() => setShowDetail(false)}
        loading={parkingSpotDetailLoad}
        error={parkingSpotsErrorr}
        detail={parkingSpotDetail}
        currentLocation={location}
        onRouteFound={(coords) => setRouteCoords(coords)}
      />
      <FloodReportModal
        visible={showReport}
        onClose={() => setShowReport(false)}
        onSubmit={() => {
          console.log("Đã gửi báo cáo");
          setShowReport(false);
        }}
      />
      {/* <AllowedParkingRouteModal
        route={selectedRoute}
        onClose={() => setSelectedRoute(null)}
      /> */}
      {/* <ConfirmParkingModal
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
