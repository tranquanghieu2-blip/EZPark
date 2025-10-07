// HelpModal.tsx
import { IconLine } from "@/components/Icons";
import { icons } from "@/constants/icons";
import React from "react";
import { Image, Modal, Pressable, Text, View } from "react-native";

interface HelpModalProps {
  visible: boolean;
  onClose: () => void;
}

export function HelpModalParkingSpot({ visible, onClose }: HelpModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/30">
        <View className="bg-white w-4/5 p-6 rounded-2xl">
          <Text className="text-xl font-bold text-center">📘 Chú thích</Text>
          <View className="my-4 w-4/5">
            <View className="flex-row items-center gap-3 mb-1">
              <Image
                source={icons.iconParkingSpot}
                style={{ width: 30, height: 30 }}
                resizeMode="contain"
              />
              <Text className="text-lg">Các bãi đỗ xe</Text>
            </View>
            <View className="flex-row items-center gap-3">
              <IconLine size={30} color= "green" />
              <Text className="text-lg">Các tuyến đường đỗ xe</Text>
            </View>
          </View>
          <Pressable
            onPress={onClose}
            className=" bg-gray-200 w-full h-[40px] px-4 py-2 rounded-xl self-center justify-center items-center"
          >
            <Text className="text-black text-center font-semibold">Đóng</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export function HelpModalNoParkingRoute({ visible, onClose }: HelpModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/30">
        <View className="bg-white w-4/5 p-6 rounded-2xl">
          <Text className="text-xl font-bold text-center">📘 Chú thích</Text>
          <View className="my-3 w-4/5">
            <View className="flex-row items-center gap-3 mb-1">
              <IconLine size={30} color= "red" />
              <Text className="text-lg">Cấm đỗ xe</Text>
            </View>
            <View className="flex-row items-center gap-3 mb-1">
              <IconLine size={30} color= "orange" />
              <Text className="text-lg">Cấm đỗ xe ngày chẵn/lẻ</Text>
            </View>
            <View className="flex-row items-center gap-3">
              <IconLine size={30} color= "purple" />
              <Text className="text-lg">Cấm dừng và đỗ xe</Text>
            </View>
          </View>
          <Pressable
            onPress={onClose}
            className=" bg-gray-200 w-full h-[40px] px-4 py-2 rounded-xl self-center justify-center items-center"
          >
            <Text className="text-black text-center font-semibold">Đóng</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
