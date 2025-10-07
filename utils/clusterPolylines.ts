import { Region } from "react-native-maps";

export function clusterPolylines(
  routes: NoParkingRoute[],
  region: Region,
  zoomFactor = 0.05
) {
  if (!routes) return [];

  const clusters: { [key: string]: NoParkingRoute[] } = {};

  routes.forEach((route) => {
    if (!route.route) return;

    // Lấy trung điểm polyline
    const coords = route.route.coordinates;
    const mid = coords[Math.floor(coords.length / 2)];
    const lat = mid[1];
    const lon = mid[0];

    // Quy về ô grid
    const gridX = Math.floor(lon / zoomFactor);
    const gridY = Math.floor(lat / zoomFactor);
    const key = `${gridX}_${gridY}`;

    if (!clusters[key]) clusters[key] = [];
    clusters[key].push(route);
  });

  // Chọn 1 đại diện trong cluster (VD: tuyến dài nhất)
  const clusteredRoutes: NoParkingRoute[] = Object.values(clusters).map((group) =>
    group.reduce((a, b) =>
      (a.route?.coordinates.length || 0) > (b.route?.coordinates.length || 0) ? a : b
    )
  );

  return clusteredRoutes;
}
