import { useState } from "react";
import { searchParkingSpot } from "@/service/api";
import { calculateDistance } from "@/utils/distance";

export const useSearchParking = () => {
  const [spots, setSpots] = useState<SearchParkingSpot[]>([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true); // kiểm soát load thêm

  const limit = 5;

  /**
   * @param query Tên bãi đỗ xe muốn tìm
   * @param reset Có reset danh sách không
   * @param typeParkingSpot Loại bãi đỗ (nếu có)
   * @param coords Vị trí hiện tại { latitude, longitude }
   */
  const fetchSpots = async (
    query: string,
    reset = false,
    typeParkingSpot?: string,
    coords?: { latitude: number; longitude: number }
  ) => {
    if (!query.trim() || !coords) return;

    try {
      setLoading(true);

      const data = await searchParkingSpot({
        nameParking: query,
        latitude: coords.latitude,
        longitude: coords.longitude,
        page: 1,
        limit,
        offset: reset ? 0 : offset,
        type: typeParkingSpot,
      });

      // 🔹 Tính khoảng cách đến từng bãi đỗ
      const enriched = data.map((item: SearchParkingSpot) => ({
        ...item,
        distance: calculateDistance(
          coords.latitude,
          coords.longitude,
          item.latitude,
          item.longitude
        ),
      }));

      if (reset) {
        setSpots(enriched);
        setOffset(limit);
      } else {
        setSpots((prev) => [...prev, ...enriched]);
        setOffset((prev) => prev + limit);
      }

      setHasMore(data.length === limit);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = () => {
    setSpots([]);
    setOffset(0);
    setHasMore(true);
  };

  return { spots, loading, fetchSpots, resetSearch, hasMore };
};
