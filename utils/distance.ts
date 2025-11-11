import { getRoutes } from "@/service/routingService";

/**
 * Đổi độ sang radian (hàm phụ trợ nếu vẫn cần)
 */
export const toRad = (value: number) => (value * Math.PI) / 180;

/**
 * Tính khoảng cách giữa 2 tọa độ thông qua API định tuyến.
 * @param lat1 Vĩ độ điểm bắt đầu
 * @param lon1 Kinh độ điểm bắt đầu
 * @param lat2 Vĩ độ điểm đến
 * @param lon2 Kinh độ điểm đến
 * @returns Promise<number | null> khoảng cách tính bằng km
 */
export const calculateDistance = async (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): Promise<number | null> => {
  try {
    const routes = await getRoutes(
      [lon1, lat1],
      [lon2, lat2]
    );

    if (routes && routes.length > 0) {
      const mainRoute = routes[0];
      const distanceKm = mainRoute.distance / 1000; // m → km
      return parseFloat(distanceKm.toFixed(2));
    }

    return null;
  } catch (error) {
    console.error("Route error:", error);
    return null;
  }
};
