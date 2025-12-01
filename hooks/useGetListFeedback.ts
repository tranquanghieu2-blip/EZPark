import { useState } from "react";
import { getListFeedback, getListFeedbackWithoutAccessToken } from "@/service/api";
import { useAuth } from "@/app/context/AuthContext";


export const useGetListFeedback = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { user } = useAuth();

  const fetchFeedbacks = async (
    parkingSpotId: number,
    reset = false,
    limit = 5
  ) => {
    if (!parkingSpotId || loading) return;

    try {
      setLoading(true);

      // Nếu reset thì bắt đầu lại từ 0
      const currentOffset = reset ? 0 : offset;

      let data;
      if (!user) {
        console.log('Fetching feedback without access token for parking spot ID:', parkingSpotId);
        data = await getListFeedbackWithoutAccessToken(parkingSpotId, limit, currentOffset);
      }
      data = await getListFeedback(parkingSpotId, limit, currentOffset);

      if (reset) {
        setFeedbacks(data.feedbacks);
      } else {
        setFeedbacks((prev) => [...prev, ...data.feedbacks]);
      }

      setOffset(currentOffset + data.feedbacks.length);
      setHasMore(data.hasMore ?? data.feedbacks.length === limit);
    } catch (err) {
      console.error("Lỗi khi lấy danh sách feedback:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetFeedbacks = () => {
    setFeedbacks([]);
    setOffset(0);
    setHasMore(true);
  };

  return { feedbacks, loading, fetchFeedbacks, resetFeedbacks, hasMore };
};
