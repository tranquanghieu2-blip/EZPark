import { useState } from "react";
import { searchParkingSpot, getFeedbackStatistic } from "@/service/api";
import { calculateDistance } from "@/utils/distance";

export const useSearchParking = () => {
  const [spots, setSpots] = useState<SearchParkingSpotWithStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const limit = 5;

  /**
   * @param query - Tên bãi đỗ xe muốn tìm
   * @param reset - Có reset danh sách không
   * @param typeParkingSpot - Loại bãi đỗ (nếu có)
   * @param selectedRating - Đánh giá đã chọn (nếu có)
   * @param coords - Vị trí hiện tại { latitude, longitude }
   */
  const fetchSpots = async (
    query: string,
    reset = false,
    typeParkingSpot?: string,
    selectedRating?: number,
    coords?: { latitude: number; longitude: number }
  ) => {
    if (!query.trim() || !coords) return;

    try {
      setLoading(true);

      // Gọi API tìm kiếm
      const data = await searchParkingSpot({
        nameParking: query,
        latitude: coords.latitude,
        longitude: coords.longitude,
        page: 1,
        limit,
        offset: reset ? 0 : offset,
        type: typeParkingSpot,
        avgRating: selectedRating,
      });

      // Tính khoảng cách
      const enriched = data.map((item: SearchParkingSpot) => ({
        ...item,
        distance: calculateDistance(
          coords.latitude,
          coords.longitude,
          item.latitude,
          item.longitude
        ),
      }));

      // Gọi thống kê feedback song song
      const enrichedWithStats = await Promise.all(
        enriched.map(async (spot) => {
          try {
            const stat = await getFeedbackStatistic(spot.parking_spot_id);
            return { ...spot, statistics: stat };
          } catch {
            return { ...spot, statistics: { avgRating: 0, totalReviews: 0 } };
          }
        })
      );

      // Cập nhật state
      if (reset) {
        setSpots(enrichedWithStats);
        setOffset(limit);
      } else {
        setSpots((prev) => [...prev, ...enrichedWithStats]);
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
