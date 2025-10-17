import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  IconStar,
  IconStarHalf,
  IconStarNo,
  IconDistance,
  IconParkingSpotType,
} from "@/components/Icons";
import Colors from "@/constants/colors";
import { images } from "@/constants/images";
import CustomMenu from "@/components/CustomMenu";
import { useAuth } from "@/app/context/AuthContext";
import useFetch from "@/hooks/useFetch";
import { getFeedbackStatistic, getListFeedback, getMyFeedback } from "@/service/api";

// ================= Type định nghĩa =================
type RootStackParamList = {
  SearchParkingSpot: undefined;
  ParkingSpotDetail: { spot: SearchParkingSpot };
};

type Props = NativeStackScreenProps<RootStackParamList, "ParkingSpotDetail">;

type RatingsMap = { 1: number; 2: number; 3: number; 4: number; 5: number };

// ================= Data mẫu đánh giá =================

// ================= Helper Components =================

// Hiển thị hàng sao
const RatingStars = ({ value, size = 16 }: { value: number; size?: number }) => {
  const stars = [];
  const fullStars = Math.floor(value);
  const hasHalfStar = value % 1 >= 0.25 && value % 1 < 0.95;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  for (let i = 0; i < fullStars; i++) {
    stars.push(<IconStar key={`full-${i}`} size={size} color={Colors.star} />);
  }
  if (hasHalfStar) {
    stars.push(<IconStarHalf key="half" size={size} color={Colors.star} />);
  }
  for (let i = 0; i < emptyStars; i++) {
    stars.push(<IconStarNo key={`empty-${i}`} size={size} color={Colors.star_no} />);
  }

  return <View className="flex-row items-center">{stars}</View>;
};

// 📊 Thanh tỷ lệ đánh giá
const RatingBar = ({
  level,
  count,
  total,
  barColor = Colors.star,
}: {
  level: number;
  count: number;
  total: number;
  barColor?: string;
}) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <View className="flex-row items-center w-full mb-1">
      <View className="w-12 flex-row items-center">
        <Text className="text-sm text-gray-700 mr-1">{level}</Text>
        <IconStar size={14} color={Colors.star} />
      </View>
      <View className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
        <View
          style={{ width: `${pct}%`, backgroundColor: barColor }}
          className="h-3 rounded-full"
        />
      </View>
      <Text className="w-12 text-right text-sm text-gray-600">{count}</Text>
    </View>
  );
};

// ================= Main Component =================
const typeLabel: Record<"parking hub" | "on street parking", string> = {
  "parking hub": "Bãi đỗ xe tập trung",
  "on street parking": "Đỗ xe ven đường",
};

const ParkingSpotDetail = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, "ParkingSpotDetail">>();
  const { spot } = route.params;
  const { user, accessToken } = useAuth();

  // === Gọi API đánh giá của người dùng ===
  const fetchMyFeedback = useCallback(() => {
    if (!spot?.parking_spot_id) {
      return Promise.reject(new Error("Missing parking_spot_id"));
    }
    return getMyFeedback(spot.parking_spot_id);
  }, [spot?.parking_spot_id]);


  const {
    data: myFeedback,
    loading: myFeedbackLoading,
    error: myFeedbackError,
    refetch: refetchFeedback,
  } = useFetch<Feedback>(
    accessToken ? fetchMyFeedback : null,
    true,
    [spot?.parking_spot_id]
  );

  // ==== Danh sách feedback ====
  const {
    data: listFeedback,
    loading: listFeedbackLoading,
    error: listFeedbackError,
    refetch: refetchListFeedback,
  } = useFetch<Feedback[]>(
    accessToken
      ? () => getListFeedback(
        spot?.parking_spot_id,
        myFeedback ? 4 : 5, // nếu đã có feedback thì bớt 1 phần tử
        0
      )
      : null,
    true,
    [spot?.parking_spot_id, myFeedback, accessToken]
  );


  // ==== Thống kê feedback ====
  const {
    data: statistics,
    loading: statisticsLoading,
    error: statisticsError,
    refetch: refetchStatistics,
  } = useFetch<FeedbackStatistics>(
    spot?.parking_spot_id
      ? () => getFeedbackStatistic(spot.parking_spot_id)
      : null,
    true,
    [spot?.parking_spot_id]
  );


  const MOCK_RATINGS: RatingsMap = {
    5: statistics?.ratingDistribution?.fiveStar ?? 0,
    4: statistics?.ratingDistribution?.fourStar ?? 0,
    3: statistics?.ratingDistribution?.threeStar ?? 0,
    2: statistics?.ratingDistribution?.twoStar ?? 0,
    1: statistics?.ratingDistribution?.oneStar ?? 0,
  };

  const hasFeedback = !!myFeedback;
  const rating = myFeedback?.average_rating ?? 0;

  // ==== Tính toán trung bình mock data ====
  const totalReviews = Object.values(MOCK_RATINGS).reduce((s, v) => s + v, 0);
  const weightedSum = Object.entries(MOCK_RATINGS).reduce(
    (s, [star, count]) => s + Number(star) * count,
    0
  );
  const avg = totalReviews > 0 ? Math.round((weightedSum / totalReviews) * 10) / 10 : 0;

  const roundedRating = Math.round(rating); // làm tròn theo quy tắc 0.5 trở lên → +1

  const handleDelete = () => console.log("Delete clicked");
  const handleUpdate = () => console.log("Update clicked");

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1 mx-4">
        {/* ==== Thông tin bãi đỗ ==== */}
        <View className="flex gap-1 mt-3">
          <Text className="text-xl font-bold text-black">{spot.name}</Text>
          <Text className="text-base text-gray-600">{spot.address}</Text>

          <View className="flex-row items-center mt-1 flex-wrap">
            {/* Khoảng cách */}
            <View className="flex-row items-center">
              <IconDistance size={20} color={Colors.blue_button} />
              <Text className="ml-1 text-sm text-gray-500">
                {spot.distance?.toFixed(2)} km
              </Text>
            </View>

            <View className="w-[2px] h-4 bg-gray-300 mx-4 rounded-full" />

            {/* Đánh giá sao */}
            <View className="flex-row items-center gap-1">
              <Text className="text-sm font-medium text-gray-700">{Number((statistics?.avgRating ?? 0).toFixed(1))}</Text>
              <RatingStars value={Number((statistics?.avgRating ?? 0).toFixed(1))} size={16} />
              <Text className="text-sm text-gray-500">
                ({totalReviews.toLocaleString()})
              </Text>
            </View>

            <View className="w-[2px] h-4 bg-gray-300 mx-4 rounded-full" />

            {/* Loại bãi */}
            <View className="flex-row items-center">
              <IconParkingSpotType size={20} color={Colors.blue_button} />
              <Text className="ml-1 text-sm text-gray-500">
                {typeLabel[spot.type]}
              </Text>
            </View>
          </View>

          {/* Nút chỉ đường */}
          <Pressable className="bg-blue-500 active:bg-blue-600 px-4 py-3 rounded-xl items-center justify-center mt-4">
            <Text className="text-white font-semibold text-base">Chỉ đường</Text>
          </Pressable>

          <View className="h-[1px] bg-gray-300 w-full mt-3" />
        </View>

        {/* ==== Đánh giá tổng quan ==== */}
        <View className="mt-5">
          <Text className="text-lg font-semibold text-black mb-4">Đánh giá tổng quan</Text>

          <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <View className="flex-row">
              <View className="w-1/3 items-center justify-center pr-2">
                <Text className="text-3xl font-extrabold text-gray-900">{Number((statistics?.avgRating ?? 0).toFixed(1))}</Text>
                <View className="mt-2">
                  <RatingStars value={Number((statistics?.avgRating ?? 0).toFixed(1))} size={16} />
                </View>
                <Text className="mt-2 text-sm text-gray-500">
                  {totalReviews.toLocaleString()} đánh giá
                </Text>
              </View>

              <View className="flex-1 pl-3">
                {[5, 4, 3, 2, 1].map((lvl) => (
                  <RatingBar
                    key={lvl}
                    level={lvl}
                    count={MOCK_RATINGS[lvl as keyof RatingsMap]}
                    total={totalReviews}
                  />
                ))}
              </View>
            </View>
          </View>

          <View className="h-[1px] bg-gray-300 w-full mt-4" />
        </View>

        {/* ==== Đánh giá của bạn ==== */}
        <View className="mt-5">
          <View className="flex-row justify-between items-center">
            <Text className="text-lg font-semibold text-black">Đánh giá của bạn</Text>
            {/* {hasFeedback && <CustomMenu onUpdate={handleUpdate} onDelete={handleDelete} />} */}
          </View>

          {/* 🌀 Loading state */}
          {myFeedbackLoading && (
            <View className="flex-row items-center justify-center mt-4">
              <ActivityIndicator size="small" color={Colors.blue_button} />
              <Text className="ml-2 text-gray-600">Đang tải đánh giá của bạn...</Text>
            </View>
          )}

          {/* ⚠️ Error state */}
          {myFeedbackError && !myFeedbackLoading && (
            <View className="mt-3 p-3 bg-red-50 rounded-xl">
              <Text className="text-red-600 font-medium mb-2">
                ⚠️ {myFeedbackError.message || "Không thể tải đánh giá."}
              </Text>
              <TouchableOpacity onPress={refetchFeedback} className="self-start">
                <Text className="text-blue-600 underline">Thử lại</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ⭐ Đánh giá hiển thị khi có dữ liệu */}
          {!myFeedbackLoading && !myFeedbackError && (
            <>
              <View className="flex-row items-center mt-4">
                {/* Avatar */}
                <View className="w-14 h-14 rounded-full overflow-hidden border border-gray-300">
                  {user?.avatar ? (
                    <Image
                      source={{ uri: user.avatar }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-14 h-14 rounded-full bg-gray-300 items-center justify-center">
                      {user?.name ? (
                        <Text className="text-2xl font-bold text-white text-center">
                          {user.name[0].toUpperCase()}
                        </Text>
                      ) : (
                        <Image
                          source={images.avatar}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      )}
                    </View>
                  )}
                </View>

                <View className="flex-row ml-4">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const diff = rating - star;

                    // ⭐ logic xác định loại sao
                    const isFull = diff >= 0;             
                    const isHalf = diff > -1 && diff < 0;  
                    const isEmpty = diff <= -1;

                    return (
                      <TouchableOpacity
                        key={star}
                        onPress={() =>
                          navigation.navigate("Rating", {
                            spot,
                            myFeedback,
                            user,
                            onGoBack: () => {
                              refetchFeedback();
                              refetchStatistics();
                            },
                          })
                        }
                        activeOpacity={0.7}
                      >
                        {isFull ? (
                          <IconStar size={40} color={Colors.star} style={{ marginHorizontal: 4 }} />
                        ) : isHalf ? (
                          <IconStarHalf size={40} color={Colors.star} style={{ marginHorizontal: 4 }} />
                        ) : (
                          <IconStarNo size={40} color={Colors.star_no} style={{ marginHorizontal: 4 }} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>


              </View>

              {hasFeedback ? (
                <View className="mt-3">
                  {myFeedback.comment ? (
                    <Text className="text-black text-base">{myFeedback.comment}</Text>
                  ) : (
                    <Text className="text-gray-500 italic">Bạn chưa thêm bình luận.</Text>
                  )}
                  <Text className="text-gray-500 text-xs mt-1">
                    Cập nhật lần cuối:{" "}
                    {new Date(myFeedback.updated_at).toLocaleString("vi-VN")}
                  </Text>
                </View>
              ) : (
                <View className="mt-3">
                  <Text className="text-gray-500 italic">
                    Bạn chưa đánh giá bãi này. Hãy nhấn vào ngôi sao để gửi đánh giá đầu tiên!
                  </Text>
                </View>
              )}
            </>
          )}

          <View className="h-[1px] bg-gray-300 w-full mt-4" />
        </View>
      </ScrollView>
    </View>
  );
};

export default ParkingSpotDetail;
