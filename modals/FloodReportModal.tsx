import React from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { IconSearchLocation, IconsMap } from "@/components/Icons"; // thay icon của bạn

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

const FloodReportModal: React.FC<Props> = ({ visible, onClose, onSubmit }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose} // Android back button
    >
      {/* Overlay bấm ra ngoài để đóng */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/40 justify-center items-center ">
          {/* Chặn propagation khi bấm vào modal nội dung */}
          <TouchableWithoutFeedback>
            <View className="bg-white rounded-2xl p-6 w-full max-w-md">
              {/* Header */}
              <View className="items-center mb-4">
                <Image
                  source={require("@/assets/icons/alert.png")}
                  className="w-12 h-12 mb-2"
                  resizeMode="contain"
                />
                <Text className="text-lg font-bold text-gray-800">
                  Báo cáo ngập lụt
                </Text>
              </View>

              {/* Ô nhập địa điểm */}
              <View className="flex-row items-center border border-red-300 rounded-lg overflow-hidden mb-3 h-[50px]">
                <View className="justify-center items-center px-4 bg-red-400 h-full">
                  <IconSearchLocation size={20} color="#fff" />
                </View>
                <TextInput
                  placeholder="Địa điểm cụ thể"
                  placeholderTextColor="#999"
                  className="flex-1 px-3 py-2 text-gray-800"
                />
              </View>

              {/* Vị trí hiện tại */}
              <View className="flex-row items-center mb-5">
                <IconsMap size={18} color="red" />
                <Text className="ml-2 text-gray-600">Lấy vị trí hiện tại</Text>
              </View>

              {/* Nút hành động */}
              <View className="flex-row justify-between gap-4">
                <Pressable
                  onPress={onClose}
                  className="flex-1 bg-gray-400 py-3 rounded-lg justify-center items-center"
                >
                  <Text className="text-white font-semibold">Đóng</Text>
                </Pressable>

                <Pressable
                  onPress={onSubmit}
                  className="flex-1 bg-blue-500 py-3 rounded-lg justify-center items-center"
                >
                  <Text className="text-white font-semibold">Báo cáo</Text>
                </Pressable>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default FloodReportModal;
