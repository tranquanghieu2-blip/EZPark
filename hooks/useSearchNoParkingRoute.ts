import { useState } from "react";
import {searchNoParkingRoute } from "@/service/api";

export const useSearchNoParkingRoute = () => {
  const [noParkingRoutes, setNoParkingRoutes] = useState<SearchNoParkingRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const limit = 5;

  /**
   * @param query - Tên bãi đỗ xe muốn tìm
   * @param reset - Có reset danh sách không
   * @param coords - Vị trí hiện tại { latitude, longitude }
   */
  const fetchNoParkingRoutes = async (
    query: string,
    reset = false,
    coords?: { latitude: number; longitude: number }
  ) => {
    if (!query.trim() || !coords) return;

    try {
      setLoading(true);

      //  Gọi API tìm kiếm tuyến cấm đỗ xe
      const data = await searchNoParkingRoute({
        street: query,
        latitude: coords.latitude,
        longitude: coords.longitude,
        page: 1,
        limit,
        offset: reset ? 0 : offset,
      });

      console.log("SearchNoParkingRoute - fetched data:", data);    
      // Cập nhật state
      if (reset) {
        setNoParkingRoutes(data);
        setOffset(limit);
      } else {
        setNoParkingRoutes((prev) => [...prev, ...data]);
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
    setNoParkingRoutes([]);
    setOffset(0);
    setHasMore(true);
  };

  return { noParkingRoutes, loading, fetchNoParkingRoutes, resetSearch, hasMore };
};
