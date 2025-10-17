/** Khoảng cách điểm → đoạn tuyến (m) */
function getDistanceMeters(
  lat: number,
  lon: number,
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const toRad = (deg: number): number => (deg * Math.PI) / 180;

  const x = R * toRad(lon) * Math.cos(toRad(lat));
  const y = R * toRad(lat);
  const x1 = R * toRad(lon1) * Math.cos(toRad(lat1));
  const y1 = R * toRad(lat1);
  const x2 = R * toRad(lon2) * Math.cos(toRad(lat2));
  const y2 = R * toRad(lat2);

  const A = { x: x1, y: y1 };
  const B = { x: x2, y: y2 };
  const P = { x, y };

  const AB = { x: B.x - A.x, y: B.y - A.y };
  const AP = { x: P.x - A.x, y: P.y - A.y };
  const ab2 = AB.x * AB.x + AB.y * AB.y;
  const t = Math.max(0, Math.min(1, (AP.x * AB.x + AP.y * AB.y) / ab2));

  const closest = { x: A.x + AB.x * t, y: A.y + AB.y * t };
  const dx = P.x - closest.x;
  const dy = P.y - closest.y;

  return Math.sqrt(dx * dx + dy * dy);
}

/** Khoảng cách 2 điểm */
export function getPointDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (v: number): number => (v * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Kiểm tra user có nằm gần tuyến đường (polyline) không */
export function isUserOnRoute(
  userLat: number,
  userLon: number,
  route: [number, number][],
  toleranceMeters: number
): boolean {
  if (!route || route.length < 2) return false;

  let minDistance = Infinity;
  for (let i = 0; i < route.length - 1; i++) { 
    const [lon1, lat1] = route[i];
    const [lon2, lat2] = route[i + 1];
    const d = getDistanceMeters(userLat, userLon, lat1, lon1, lat2, lon2);
    minDistance = Math.min(minDistance, d);
  }
  return minDistance <= toleranceMeters;
}

