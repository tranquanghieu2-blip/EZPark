export function clusterPolylines(
  routes: NoParkingRoute[],
  zoom: number
) {
  if (!routes || routes.length === 0) return [];

  // zoom càng nhỏ -> cluster càng rộng
  const zoomFactor = Math.max(0.005, 0.05 / Math.pow(zoom, 1.0));

  const clusters: Record<string, NoParkingRoute[]> = {};

  routes.forEach((route) => {
    if (!route.route || !route.route.coordinates?.length) return;

    // Lấy trung điểm tuyến
    const coords = route.route.coordinates;
    const mid = coords[Math.floor(coords.length / 2)];
    const lon = mid[0];
    const lat = mid[1];

    // Chia lưới bản đồ (mỗi cell có kích thước phụ thuộc zoom)
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
