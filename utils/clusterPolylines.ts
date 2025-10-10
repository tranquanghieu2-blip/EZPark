export function clusterPolylines(
  routes: NoParkingRoute[],
  zoomFactor: number
) {
  if (!routes || routes.length === 0) return [];

  const clusters: Record<string, NoParkingRoute[]> = {};

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

  // Chọn 1 tuyến đại diện (VD: tuyến dài nhất)
  const clusteredRoutes = Object.values(clusters).map((group) =>
    group.reduce((a, b) =>
      (a.route?.coordinates.length || 0) > (b.route?.coordinates.length || 0)
        ? a
        : b
    )
  );

  return clusteredRoutes;
}


