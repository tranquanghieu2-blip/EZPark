import React from "react";
import {
  Modal,
  Pressable,
  Text,
  View,
  Animated,
  Easing,
} from "react-native";
import { IconLine } from "@/components/Icons";
import GradientButton from "@/components/GradientButton";

interface ConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  type?: "create" | "edit";
}

export function ConfirmDeleteFeedback({
  visible,
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View
        className="flex-1 justify-center items-center bg-black/30"
      >
        <View

          className="bg-white w-4/5 max-w-md p-6 rounded-2xl shadow-lg"
        >
          {/* Header icon + title */}
          <View className="items-center mb-4">
            <View className="bg-red-100 p-3 rounded-full mb-3">
              <IconLine size={36} color="#E53935" />
            </View>
            <Text className="text-xl font-bold text-center text-black">
              Xác nhận xoá
            </Text>
          </View>

          {/* Description */}
          <Text className="text-center text-gray-700 text-base leading-6 mb-5">
            Đánh giá của bạn sẽ bị xoá.
          </Text>

          {/* Buttons */}
          <View className="flex-row justify-between mt-3 gap-3">
            <Pressable
              onPress={onClose}
              className="flex-1 py-3 rounded-xl bg-gray-200 active:bg-gray-200 items-center justify-center"
            >
              <Text className="text-center text-black font-semibold text-base">
                Huỷ
              </Text>
            </Pressable>

            <GradientButton
              onPress={() => {
                onConfirm?.();
                onClose();
              }}
              className="flex-1 py-3 rounded-xl items-center justify-center"
              className2="flex-1"
            >
              <Text className="text-center text-white font-semibold text-base">
                Xác nhận
              </Text>
            </GradientButton>
          </View>
        </View>
      </View>
    </Modal>
  );
}
