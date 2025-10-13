import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { IconStar, IconStarNo } from "@/components/Icons";
import { images } from "@/constants/images";
import GradientButton from "@/components/GradientButton";
import { ConfirmFeedbackModal } from "@/modals/ConfirmFeedbackModal";


type RatingItem = {
  id: string;
  label: string;
};

const ratingItems: RatingItem[] = [
  { id: "convenience", label: "Mức độ thuận tiện" },
  { id: "space", label: "Không gian đỗ xe" },
  { id: "security", label: "An ninh - an toàn" },
];

const Rating = () => {
  const [ratings, setRatings] = useState<Record<string, number>>({
    convenience: 0,
    space: 0,
    security: 0,
  });
  const [comment, setComment] = useState("");
  const MAX_CHAR = 200;

  const [isFocused, setIsFocused] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  // ===== Helper text feedback =====
  const getFeedbackText = (value: number) => {
    switch (value) {
      case 5:
        return "Tuyệt vời";
      case 4:
        return "Hài lòng";
      case 3:
        return "Bình thường";
      case 2:
        return "Chưa tốt lắm";
      case 1:
        return "Tệ";
      default:
        return "Chạm để đánh giá";
    }
  };

  // ===== Handle star click =====
  const handleRating = (id: string, value: number) => {
    setRatings((prev) => ({ ...prev, [id]: value }));
  };

  // ===== Handle submit =====
  const handleSubmit = () => {
    // const result: Record<string, number> = {};
    // ratingItems.forEach((item) => {
    //   result[item.label] = ratings[item.id];
    // });

    // const feedback = {
    //   ...result,
    //   "Đánh giá": comment.trim(),
    // };

    // console.log("✅ Dữ liệu gửi đi:", feedback);
    setShowConfirm(true);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View className="flex-1 bg-white px-4">
        {/* Avatar + User info */}
        <View className="flex-row items-center bg-white py-4 rounded-xl shadow-sm mt-2">
          <View className="w-14 h-14 rounded-full overflow-hidden border border-gray-300">
            <Image source={images.avatar} className="w-full h-full" />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-base font-semibold text-gray-900">
              Trần Quang Hiếu
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
              {/* Tiêu đề */}
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
                          color="#f5c518"
                          style={{ marginHorizontal: 3 }}
                        />
                      ) : (
                        <IconStarNo
                          size={26}
                          color="#d1d5db"
                          style={{ marginHorizontal: 3 }}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Text feedback */}
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
            className={`p-3 border rounded-lg text-base text-gray-900 h-[130px] ${isFocused ? "border-1 border-red-500" : "border border-gray-300"}`}
            textAlignVertical="top"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          <Text className="absolute bottom-2 right-3 text-xs text-gray-400">
            {comment.length}/{MAX_CHAR}
          </Text>
        </View>

        {/* Submit button */}
        <GradientButton
          className="mt-4 py-3 bg-blue-500 rounded-xl items-center justify-center h-[45px]"
          onPress={handleSubmit}
        >
          <Text className="text-white font-semibold text-base">Gửi đánh giá</Text>
        </GradientButton>

        <ConfirmFeedbackModal
          visible={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={() => console.log("✅ Đã xác nhận đánh giá")}
        />

      </View>


    </TouchableWithoutFeedback>

  );
};

export default Rating;
