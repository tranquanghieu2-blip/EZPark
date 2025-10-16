import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  Pressable,
} from "react-native";
import { IconStar, IconStarNo } from "@/components/Icons";
import { images } from "@/constants/images";
import GradientButton from "@/components/GradientButton";
import { ConfirmFeedbackModal } from "@/modals/feedback/ConfirmFeedbackModal";
import { ConfirmUpdateFeedback } from "@/modals/feedback/ConfirmUpdateFeeback";
import { ConfirmDeleteFeedback } from "@/modals/feedback/ConfirmDeleteFeeback";
import { useRoute, RouteProp } from "@react-navigation/native";
import { useAuth } from "@/app/context/AuthContext";
import { createFeedback, updateFeedback, deleteFeedback } from "@/service/api";
import useFetch from "@/hooks/useFetch";
import { useNavigation } from "@react-navigation/native";
import Colors from "@/constants/colors";

// ========================== TYPES ==========================
type RootStackParamList = {
  Rating: { 
    spot: ParkingSpotDetail, 
    myFeedback?: Feedback | null, 
    user?: User | null,
    onGoBack?: () => void };
};

type RatingItem = {
  id: keyof RatingValues;
  label: string;
};

type RatingValues = {
  convenience: number;
  space: number;
  security: number;
};

// ========================== CONSTANTS ==========================
const ratingItems: RatingItem[] = [
  { id: "convenience", label: "Mức độ thuận tiện" },
  { id: "space", label: "Không gian đỗ xe" },
  { id: "security", label: "An ninh - an toàn" },
];

const MAX_CHAR = 200;



// ========================== COMPONENT ==========================
const Rating = () => {
  const route = useRoute<RouteProp<RootStackParamList, "Rating">>();
  const { spot } = route.params;
  const { myFeedback } = route.params || {};
  const {user} = route.params || {};
  const navigation = useNavigation<any>();
  const { onGoBack } = route.params ?? {};




  const { accessToken } = useAuth();

  const [ratings, setRatings] = useState<RatingValues>({
    convenience: myFeedback?.friendliness_rating || 0,
    space: myFeedback?.space_rating || 0,
    security: myFeedback?.security_rating || 0,
  });
  const [comment, setComment] = useState(myFeedback?.comment || "");
  const [isFocused, setIsFocused] = useState(false);
  const [showConfirmCreate, setShowConfirmCreate] = useState(false);
  const [showConfirmUpdate, setShowConfirmUpdate] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);

  // ========================== API CALL ==========================
  // 🔧 Dựng payload chung
  const buildFeedbackData = () => ({
    parking_spot_id: spot.parking_spot_id,
    friendliness_rating: ratings.convenience,
    space_rating: ratings.space,
    security_rating: ratings.security,
    comment,
  });

  // Validate trước khi gửi
  const validateBeforeSubmit = useCallback(() => {
    if (!accessToken) {
      Alert.alert("Thông báo", "Bạn cần đăng nhập để gửi đánh giá.");
      return false;
    }
    if (!spot?.parking_spot_id) {
      Alert.alert("Lỗi", "Thiếu thông tin bãi đỗ xe.");
      return false;
    }
    // ít nhất 1 rating (hoặc yêu cầu tất cả > 0 tuỳ spec)
    const hasAnyRating = Object.values(ratings).every((v) => v > 0);
    if (!hasAnyRating) {
      Alert.alert("Thông báo", "Vui lòng đánh giá ít nhất một mục bằng một sao trở lên.");
      return false;
    }
    // comment optional — có thể add rule nếu muốn
    return true;
  }, [accessToken, spot, ratings]);

  // 🧠 Submit Feedback — tự động chọn Create hoặc Update
  const handleFeedbackSubmit = async () => {
    if (!validateBeforeSubmit()) return;

    try {
      setLoading(true);
      const data = buildFeedbackData();

      let res;
      if (myFeedback) {
        res = await updateFeedback(myFeedback.feedback_id, data);
      } else {
        res = await createFeedback(data);
      }

      Alert.alert("Thành công", "Đánh giá đã được lưu.", [
        {
          text: "OK",
          onPress: () => {
            if (onGoBack) onGoBack(); // gọi callback của parent
            navigation.goBack(); // quay lại màn trước
          },
        },
      ]);
      console.log("✅ Feedback response:", res);
    } catch (err: any) {
      Alert.alert("Lỗi", err.message || "Không thể gửi đánh giá.");
    } finally {
      setLoading(false);
    }
  };

  // ❌ Delete Feedback
  const handleDeleteFeedback = async () => {
    if (!myFeedback) return Alert.alert("Lỗi", "Không có feedback để xoá.");
    try {
      setLoading(true);
      await deleteFeedback(myFeedback.feedback_id);
      Alert.alert("Thành công", "Đánh giá đã được xoá.", [
        {
          text: "OK",
          onPress: () => {
            if (onGoBack) onGoBack(); // gọi callback của parent
            navigation.goBack(); // quay lại màn trước
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert("Lỗi", err.message || "Không thể xoá đánh giá.");
    } finally {
      setLoading(false);
    }
  };

  // ========================== HANDLERS ==========================
  const getFeedbackText = (value: number) => {
    const map: Record<number, string> = {
      5: "Tuyệt vời",
      4: "Hài lòng",
      3: "Bình thường",
      2: "Chưa tốt lắm",
      1: "Tệ",
    };
    return map[value] || "Chạm để đánh giá";
  };

  const handleRating = (id: keyof RatingValues, value: number) => {
    setRatings((prev) => ({ ...prev, [id]: value }));
  };



  // ========================== RENDER ==========================
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View className="flex-1 bg-white px-4">
        {/* Avatar + User info */}
        <View className="flex-row items-center bg-white py-4 rounded-xl shadow-sm mt-2">
          {/* <View className="w-14 h-14 rounded-full overflow-hidden border border-gray-300">
            <Image source={images.avatar} className="w-full h-full" />
          </View> */}
          <View className="w-14 h-14 rounded-full overflow-hidden border border-gray-300">
            {user?.avatar ? (
              <Image
                source={{ uri: user?.avatar }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-14 h-14 rounded-full bg-gray-300 items-center justify-center">
                {user?.name ? (
                  <Text className="text-2xl font-bold text-white text-center">
                    {user?.name[0].toUpperCase()}
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
              {user?.name}
            </Text>
            <Text className="text-sm text-gray-500">
              Hãy chia sẻ cảm nhận của bạn
            </Text>
          </View>
        </View>

        {/* Rating sections */}
        <View className="space-y-3">
          {ratingItems.map((item) => (
            <View
              key={item.id}
              className="flex-row items-center justify-between py-3 rounded-xl"
            >
              <Text className="text-sm font-medium text-gray-800 w-[120px]">
                {item.label}
              </Text>

              {/* Dãy sao */}
              <View className="flex-row">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isSelected = star <= (ratings[item.id] || 0);
                  return (
                    <TouchableOpacity
                      key={star}
                      onPress={() => handleRating(item.id, star)}
                      activeOpacity={0.7}
                    >
                      {isSelected ? (
                        <IconStar
                          size={26}
                          color={Colors.star}
                          style={{ marginHorizontal: 3 }}
                        />
                      ) : (
                        <IconStarNo
                          size={26}
                          color={Colors.star_no}
                          style={{ marginHorizontal: 3 }}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text className="text-xs text-gray-500 w-[100px] text-right">
                {getFeedbackText(ratings[item.id])}
              </Text>
            </View>
          ))}
        </View>

        {/* Comment input */}
        <View className="mt-6 relative">
          <TextInput
            numberOfLines={5}
            multiline
            maxLength={MAX_CHAR}
            placeholder="Viết đánh giá của bạn..."
            value={comment}
            onChangeText={setComment}
            className={`p-3 border rounded-lg text-base text-gray-900 h-[130px] ${isFocused ? "border-1 border-red-500" : "border border-gray-300"
              }`}
            textAlignVertical="top"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          <Text className="absolute bottom-2 right-3 text-xs text-gray-400">
            {comment.length}/{MAX_CHAR}
          </Text>
        </View>

        {/* Submit button */}
        {myFeedback ? (
          <View className="flex-row  gap-4">
            <Pressable
              className="mt-4 py-3 bg-red-600 rounded-xl items-center justify-center h-[45px] flex-1"
              onPress={() => setShowConfirmDelete(true)}
              disabled={loading}
            >
              <Text className="text-white font-semibold text-base">
                {loading ? "Đang gửi..." : "Xoá"}
              </Text>
            </Pressable>
            <Pressable
              className="mt-4 py-3 bg-blue-500 flex-1 rounded-xl items-center justify-center h-[45px]"

              onPress={() => setShowConfirmUpdate(true)}
              disabled={loading}
            >
              <Text className="text-white font-semibold text-base">
                {loading ? "Đang gửi..." : "Chỉnh sửa"}
              </Text>
            </Pressable>
          </View>

        ) : <GradientButton
          className="mt-4 py-3 bg-blue-500 rounded-xl items-center justify-center h-[45px]"
          onPress={() => setShowConfirmCreate(true)}
          disabled={loading}
        >
          <Text className="text-white font-semibold text-base">
            {loading ? "Đang gửi..." : "Gửi đánh giá"}
          </Text>
        </GradientButton>
        }


        <ConfirmFeedbackModal
          visible={showConfirmCreate}
          onClose={() => setShowConfirmCreate(false)}
          onConfirm={handleFeedbackSubmit}

        />

        <ConfirmUpdateFeedback
          visible={showConfirmUpdate}
          onClose={() => setShowConfirmUpdate(false)}
          onConfirm={handleFeedbackSubmit}
        />
        <ConfirmDeleteFeedback
          visible={showConfirmDelete}
          onClose={() => setShowConfirmDelete(false)}
          onConfirm={handleDeleteFeedback}
        />
      </View>
    </TouchableWithoutFeedback>
  );
};

export default Rating;
