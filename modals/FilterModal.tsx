import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import GradientWrapper from "@/components/GradientWrapper";
import GradientButton from "@/components/GradientButton";

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (filters: { criteria: string[]; parkingType: string | null }) => void;
}

const FilterModal: React.FC<FilterModalProps> = ({ visible, onClose, onConfirm }) => {
  const [criteria, setCriteria] = useState<string[]>([]);
  const [parkingType, setParkingType] = useState<string | null>(null);

  // Toggle criteria (multi-select)
  const toggleCriteria = (value: string) => {
    setCriteria((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  // Reset filters
  const resetFilters = () => {
    setCriteria([]);
    setParkingType(null);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/40 items-center justify-center">
          <TouchableWithoutFeedback>
            <SafeAreaView className="bg-white w-4/5 rounded-xl p-7">
              {/* Title */}
              <Text className="text-lg font-semibold text-center mb-4">Bộ lọc</Text>

              {/* Criteria buttons */}
              <View className="flex-row justify-center mb-4">
                {["Gần đây", "Top rate"].map((item) => {
                  const selected = criteria.includes(item);
                  return (
                    <TouchableOpacity
                      key={item}
                      onPress={() => toggleCriteria(item)}
                      className="mx-1 rounded-full overflow-hidden"
                    >
                      {selected ? (
                        <GradientWrapper style="px-6 py-3 rounded-full">
                          <Text className="text-white font-medium">{item}</Text>
                        </GradientWrapper>
                      ) : (
                        <View className="px-6 py-3 rounded-full bg-gray-100">
                          <Text className="text-black">{item}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Parking type radio buttons */}
              <View className="mb-4">
                <Text className="font-medium mb-2 text-lg">Loại đỗ xe</Text>
                {["Bãi đỗ xe tập trung", "Đỗ xe ven đường"].map((item) => {
                  const isSelected = parkingType === item;
                  return (
                    <Pressable
                      key={item}
                      onPress={() => setParkingType(item)}
                      className="flex-row items-center mb-2"
                    >
                      <View
                        style={{
                          width: 22,
                          height: 22,
                          borderWidth: 2,
                          borderColor: isSelected ? "#f87171" : "#d1d5db",
                          borderRadius: 11,
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        {isSelected && (
                          <View
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: 6,
                              backgroundColor: "#f87171",
                            }}
                          />
                        )}
                      </View>
                      <Text className="ml-2">{item}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Buttons */}
              <View className="flex-row justify-between mt-2 gap-2">
                <Pressable
                  onPress={resetFilters}
                  className="flex-1 py-3 rounded-lg bg-gray-200 items-center justify-center"
                >
                  <Text className="text-center text-black font-semibold text-lg">
                    Xoá lọc
                  </Text>
                </Pressable>

                <GradientButton
                  onPress={() => {
                    onConfirm({ criteria, parkingType });
                    onClose();
                  }}
                  className="py-3 px-5 rounded-lg items-center justify-center"
                >
                  <Text className="text-center text-white font-semibold text-lg">
                    Xác nhận
                  </Text>
                </GradientButton>
              </View>
            </SafeAreaView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default FilterModal;
