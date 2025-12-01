import { IconClock } from "@/components/Icons";
import Colors from "@/constants/colors";
import React, { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, Text, TouchableWithoutFeedback, View } from "react-native";

interface Props {
    route: NoParkingRoute | null;
    onClose: () => void;
}

// Trả về các khoảng giờ ngoài time_range
export const getAllowedTimeRanges = (ranges: { start: string; end: string }[]) => {
    const dayStart = "00:00:00";
    const dayEnd = "23:59:59";

    // Sắp xếp ranges theo start
    const sorted = [...ranges].sort((a, b) => a.start.localeCompare(b.start));

    const result: { start: string; end: string }[] = [];
    let current = dayStart;

    for (const r of sorted) {
        if (current < r.start) {
            result.push({ start: current, end: r.start });
        }
        if (current < r.end) {
            current = r.end;
        }
    }

    if (current < dayEnd) {
        result.push({ start: current, end: dayEnd });
    }

    return result;
};


const AllowedParkingRouteModal: React.FC<Props> = ({ route, onClose }) => {


    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (route) {
            // Fade in
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500, 
                useNativeDriver: true,
            }).start();
        } else {
            // Fade out
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [route]);
    return (
        <Modal
            transparent
            visible={!!route}
            animationType="none" // để mình tự điều khiển animation
            onRequestClose={onClose}

        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View className="flex-1 justify-center items-center bg-black/30 w-full h-full">
                    <View className="bg-white rounded-2xl p-6 w-4/5">
                        {route ? (
                            <View className="w-full">
                                <View className="flex items-center justify-center gap-3">
                                    {/* Text block chiếm hết phần còn lại */}
                                    <View className="flex items-center">
                                        <Text className="font-semibold text-xl text-center">Tuyến đường {route.street}</Text>
                                    </View>
                                </View>

                                {/* Thông tin chi tiết */}
                                <View className="mt-3 gap-2 w-full flex items-center">
                                    <View className="flex-row items-center gap-3 self-center">
                                        <IconClock size={24} color={Colors.blue_button} />
                                        <View>
                                            {getAllowedTimeRanges(route.time_range).map((r, idx) => (
                                                <Text key={idx}>
                                                    {r.start.slice(0, 5)} - {r.end.slice(0, 5)}
                                                </Text>
                                            ))}
                                        </View>
                                    </View>
                                </View>

                                {/* Nút điều hướng sang trang chi tiết */}
                                <Pressable>
                                    <Text className="text-blue-500 underline mt-3 text-center">
                                        Xem chi tiết
                                    </Text>
                                </Pressable>

                                <View className="flex-row justify-center w-full gap-2">
                                    <Pressable
                                        onPress={onClose}
                                        className="bg-gray-200 flex-1 h-[40px] px-4 py-2 mt-4 rounded-xl self-center justify-center items-center"
                                    >
                                        <Text className="text-black text-center font-semibold">Đóng</Text>
                                    </Pressable>
                                    <Pressable
                                        onPress={() => {

                                        }}
                                        className="bg-blue-500 flex-1 h-[40px] px-4 py-2 mt-4 rounded-xl self-center justify-center items-center"
                                    >
                                        <Text className="text-white text-center font-semibold">
                                            Chỉ đường
                                        </Text>
                                    </Pressable>
                                </View>

                            </View>
                        ) : null}
                    </View>
                </View>
            </TouchableWithoutFeedback>


        </Modal>
    );
};

export default AllowedParkingRouteModal;
