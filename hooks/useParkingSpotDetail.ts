import { useState } from "react";
import {
  getFeedbackStatistic,
  fetchParkingSpotDetail,
  fetchPredictionForParkingSpot,
} from "@/service/api";
import { calculateDistance } from "@/utils/distance";

export const useParkingSpotDetail = () => {
  const [spot, setSpot] = useState<ParkingSpotDetailWithStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchParkingSpotDetailWithStats = async (
    parking_spot_id: number,
    userLocation?: { latitude: number; longitude: number } // <-- tùy chọn
  ) => {
    if (!parking_spot_id) return;

    try {
      setLoading(true);
      setError(null);

      // Lấy chi tiết bãi xe
      const data = await fetchParkingSpotDetail(parking_spot_id);

      // Lấy thống kê feedback
      let statistics;
      try {
        statistics = await getFeedbackStatistic(parking_spot_id);
      } catch {
        statistics = { avgRating: 0, totalReviews: 0 };
      }

      // Lấy dữ liệu dự đoán (nếu có)
      let predictionData;
      try {
        predictionData = await fetchPredictionForParkingSpot(parking_spot_id, new Date());
      } catch {
        predictionData = undefined;
      }

      // Tính khoảng cách (có async)
      let distance: number | null = null;
      if (userLocation && data.latitude && data.longitude) {
        distance = await calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          data.latitude,
          data.longitude
        );
      }

      // Gộp dữ liệu
      const enrichedData: ParkingSpotDetailWithStats = {
        ...data,
        distance, // có thể là null nếu không tính được
        statistics,
        predictionData,
      };

      setSpot(enrichedData);
    } catch (err: any) {
      console.error("Fetch parking spot detail error:", err);
      setError(err.message || "Failed to fetch parking spot detail");
    } finally {
      setLoading(false);
    }
  };

  return { spot, loading, error, fetchParkingSpotDetailWithStats };
};
