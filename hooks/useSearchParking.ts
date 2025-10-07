import { useState } from "react";
import { searchParkingSpot } from "@/service/api";
import { calculateDistance } from "@/utils/distance";
import { useLocation } from "@/hooks/useLocation";

export const useSearchParking = () => {
  const { location } = useLocation();
  const [spots, setSpots] = useState<SearchParkingSpot[]>([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true); // kiểm soát load thêm

  const limit = 5;

  const fetchSpots = async (query: string, reset = false, typeParkingSpot ?: string) => {
    if (!query.trim() || !location) return;

    try {
      setLoading(true);
      const data = await searchParkingSpot({
        nameParking: query,
        latitude: location.latitude,
        longitude: location.longitude,
        page: 1, // page mặc định
        limit,
        offset: reset ? 0 : offset,
        type: typeParkingSpot,
      });

      // enrich thêm distance
      const enriched = data.map((item: SearchParkingSpot) => ({
        ...item,
        distance: calculateDistance(
          location.latitude,
          location.longitude,
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

      // nếu ít hơn limit thì coi như hết dữ liệu
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
