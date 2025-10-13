import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TouchableOpacity,
  Image,
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

// ================= Type định nghĩa =================
type RootStackParamList = {
  SearchParkingSpot: undefined;
  ParkingSpotDetail: { spot: SearchParkingSpot };
};

type Props = NativeStackScreenProps<RootStackParamList, "ParkingSpotDetail">;

type RatingsMap = { 1: number; 2: number; 3: number; 4: number; 5: number };

// ================= Data mẫu đánh giá =================
const MOCK_RATINGS: RatingsMap = {
  5: 181,
  4: 410,
  3: 195,
  2: 94,
  1: 92,
};

// ================= Helper Components =================

// ⭐ Hiển thị hàng sao
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
    stars.push(<IconStarNo key={`empty-${i}`} size={size} color={Colors.star} />);
  }

  return <View className="flex-row items-center">{stars}</View>;
};

// 📊 Thanh tỷ lệ đánh giá
const RatingBar = ({
  level,
  count,
  total,
  barColor = "#F6B21D",
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

  // Tính toán đánh giá trung bình
  const totalReviews = Object.values(MOCK_RATINGS).reduce((s, v) => s + v, 0);
  const weightedSum = Object.entries(MOCK_RATINGS).reduce(
    (s, [star, count]) => s + Number(star) * count,
    0
  );
  const avg = totalReviews > 0 ? Math.round((weightedSum / totalReviews) * 10) / 10 : 0;


  const handleDelete = () => {
    console.log("Delete clicked");
    
  };

  const handleUpdate = () => {
    console.log("Update clicked");
    
  };

  console.log("Rendering ParkingSpotDetail for:");

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
              <Text className="text-sm font-medium text-gray-700">{avg.toFixed(1)}</Text>
              <RatingStars value={avg} size={16} />
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
          <Pressable className="bg-blue-500 active:bg-blue-600 px-4 py-3 rounded-xl items-center justify-center mt-2">
            <Text className="text-white font-semibold text-base">Chỉ đường</Text>
          </Pressable>

          <View className="h-[1px] bg-gray-300 w-full mt-3" />
        </View>

        {/* ==== Đánh giá tổng quan ==== */}
        <View className="mt-5">
          <Text className="text-lg font-semibold text-black mb-4">
            Đánh giá tổng quan
          </Text>

          <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <View className="flex-row">
              {/* Trung bình */}
              <View className="w-1/3 items-center justify-center pr-2">
                <Text className="text-3xl font-extrabold text-gray-900">{avg}</Text>
                <View className="mt-2">
                  <RatingStars value={avg} size={16} />
                </View>
                <Text className="mt-2 text-sm text-gray-500">
                  {totalReviews.toLocaleString()} đánh giá
                </Text>
              </View>

              {/* Phân bố */}
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

            {/* Icon menu ba chấm */}
            <CustomMenu
              onUpdate={() => {
                handleUpdate();
              }}
              onDelete={() => {
                handleDelete();
              }}
            />
          </View>

          {/* Avatar + 5 sao */}
          <View className="flex-row items-center mt-4">
            <View className="w-14 h-14 rounded-full overflow-hidden border border-gray-300">
              <Image source={images.avatar} className="w-full h-full" />
            </View>

            <View className="flex-row ml-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => navigation.navigate("Rating", { spotItem: spot })}
                  activeOpacity={0.7}
                >
                  <IconStarNo size={40} color="#d1d5db" style={{ marginHorizontal: 4 }} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="h-[1px] bg-gray-300 w-full mt-4" />
        </View>
      </ScrollView>
    </View>

  );
};

export default ParkingSpotDetail;
