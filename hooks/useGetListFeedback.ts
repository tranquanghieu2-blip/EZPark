import { useState } from "react";
import { getListFeedback } from "@/service/api";


export const useGetListFeedback = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  /**
   * Fetch danh sách feedback
   * @param parkingSpotId id của bãi đỗ xe
   * @param reset có muốn reset danh sách cũ hay không
   * @param limit số lượng phần tử cần lấy (mặc định 5)
   */
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

      const data = await getListFeedback(parkingSpotId, limit, currentOffset);

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
