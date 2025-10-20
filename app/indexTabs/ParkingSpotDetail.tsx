import React, { useState, useCallback, useEffect } from "react";
import { View,Text,ScrollView,Pressable,TouchableOpacity,Image,ActivityIndicator,} from "react-native";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {IconStar,IconStarHalf,IconStarNo,IconDistance,IconParkingSpotType,} from "@/components/Icons";
import Colors from "@/constants/colors";
import { images } from "@/constants/images";
import CustomMenu from "@/components/CustomMenu";
import { useAuth } from "@/app/context/AuthContext";
import useFetch from "@/hooks/useFetch";
import { getFeedbackStatistic, getListFeedback, getMyFeedback } from "@/service/api";
import { useGetListFeedback } from "@/hooks/useGetListFeedback";
import { FlatList } from "react-native-gesture-handler";
import GradientButton from "@/components/GradientButton";

// ================= Type định nghĩa =================
type RootStackParamList = {
  SearchParkingSpot: undefined;
  ParkingSpotDetail: { spot: SearchParkingSpot };
};

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
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);

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
    feedbacks,
    loading: listFeedbackLoading,
    fetchFeedbacks,
    resetFeedbacks,
    hasMore,
  } = useGetListFeedback();

  console.log(feedbacks)

  useEffect(() => {
    if (!spot?.parking_spot_id) return;

    const limit = myFeedback ? 4 : 5;

    resetFeedbacks();
    fetchFeedbacks(spot.parking_spot_id, true, limit);
  }, [spot?.parking_spot_id, myFeedback?.feedback_id]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await fetchFeedbacks(
      spot.parking_spot_id,
      false
    );
    setLoadingMore(false);
  };

  const handleReset = async () => {
    setLoadingReset(true);
    await fetchFeedbacks(
      spot.parking_spot_id,
      true
    );
    setLoadingReset(false);
  };



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

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1 bg-white mx-4" showsVerticalScrollIndicator={false}>
        {/* ==== Thông tin bãi đỗ ==== */}
        <View className="flex gap-1 mt-3 ">
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

          <View
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
            style={{
              shadowColor: "#000",
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
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


          {myFeedbackLoading && (
            <View className="flex-row items-center justify-center mt-4">
              <ActivityIndicator size="small" color={Colors.blue_button} />
              <Text className="ml-2 text-gray-600">Đang tải đánh giá của bạn...</Text>
            </View>
          )}


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

        {/* ==== Danh sách các đánh giá khác ==== */}
        {listFeedbackLoading && feedbacks.length === 0 ? (
          <View className="flex-1 justify-center items-center mt-10">
            <ActivityIndicator size="small" color={Colors.blue_button} />
          </View>
        ) : (
          <FlatList
            className="mt-5"
            data={feedbacks || []}
            keyExtractor={(item) => item.feedback_id.toString()}
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={false}
            renderItem={({ item }) => (

              <View className="flex mb-4">
                <View className="flex-row items-center gap-2">
                  <View className="w-10 h-10 rounded-full overflow-hidden border border-gray-300">
                    {item.Driver?.avatar ? (
                      <Image
                        source={{ uri: item.Driver?.avatar }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-10 h-10 rounded-full bg-gray-300 items-center justify-center">
                        {item.Driver?.name ? (
                          <Text className="text-lg font-bold text-white text-center">
                            {item.Driver?.name[0].toUpperCase()}
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

                  <View className="ml-3 flex-1">
                    <Text className="text-base font-semibold text-gray-900">
                      {item.Driver.name}
                    </Text>
                    <Text className="text-sm text-gray-500">
                      Đã chia sẻ từ{" "}
                      {new Date(item?.updated_at ?? item?.created_at).toLocaleDateString("vi-VN")}
                    </Text>
                  </View>
                </View>


                <View className="flex-row mt-3">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const diff = item.average_rating - star;

                    // ⭐ logic xác định loại sao
                    const isFull = diff >= 0;
                    const isHalf = diff > -1 && diff < 0;
                    const isEmpty = diff <= -1;

                    return (
                      <TouchableOpacity
                        key={star}

                        activeOpacity={0.7}
                      >
                        {isFull ? (
                          <IconStar size={20} color={Colors.star} style={{ marginHorizontal: 2 }} />
                        ) : isHalf ? (
                          <IconStarHalf size={20} color={Colors.star} style={{ marginHorizontal: 2 }} />
                        ) : (
                          <IconStarNo size={20} color={Colors.star_no} style={{ marginHorizontal: 2 }} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {item.comment ? (
                  <Text className="text-black text-base">{item.comment}</Text>
                ) : (
                  <Text className="text-gray-500 italic text-base">Chưa thêm bình luận.</Text>
                )}
              </View>

            )}
            ListEmptyComponent={
              <View className="flex-1 justify-center items-center mt-5">
                <Image
                  source={images.noData}
                  style={{ width: 100, height: 100, resizeMode: "contain" }}
                />
                <Text className="mt-3 text-base text-gray-500 text-center">
                  Không có đánh giá nào khác
                </Text>
              </View>

            }
            ListHeaderComponent={
              feedbacks.length > 0 ? (
                <View className="flex-row justify-between mb-2">
                  <Text className="font-semibold text-lg text-black">
                    Danh sách đánh giá
                  </Text>
                  <Text className="text-sm text-gray-500 mt-1">
                    Có {feedbacks.length} đánh giá khác
                  </Text>
                </View>
              ) : null
            }
            ListFooterComponent={
              feedbacks.length > 0 ? (
                <View className="pb-6 flex-shrink-0">
                  {feedbacks.length > 5 &&
                    (loadingReset ? (
                      <ActivityIndicator />
                    ) : (
                      <TouchableOpacity
                        className="mb-3 bg-gray-200 rounded-lg h-[45px] justify-center items-center"
                        onPress={handleReset}
                        disabled={loadingReset}
                      >
                        <Text className="text-black font-medium">Rút gọn</Text>
                      </TouchableOpacity>
                    ))}

                  {hasMore && (
                    <View className="h-[45px] justify-center">
                      {loadingMore ? (
                        <ActivityIndicator />
                      ) : (
                        <GradientButton
                          className="py-3 bg-blue-500 rounded-lg h-full items-center justify-center"
                          onPress={handleLoadMore}
                          disabled={loadingMore}
                        >
                          <Text className="text-white font-semibold">Hiện thêm</Text>
                        </GradientButton>
                      )}
                    </View>
                  )}
                </View>
              ) : null
            }
          />
        )}
      </ScrollView>




    </View>
  );
};

export default ParkingSpotDetail;
