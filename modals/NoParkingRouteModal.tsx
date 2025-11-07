import React, { useEffect, useRef } from "react";
import { Modal, View, Text, Pressable, Animated, Image } from "react-native";
import { icons } from "@/constants/icons";
import Colors from "@/constants/colors";
import { IconClock, IconSideParking, IconCalendar, IconNote } from "@/components/Icons";

interface Props {
    route: NoParkingRoute | null;
    onClose: () => void;
}

const NoParkingRouteModal: React.FC<Props> = ({ route, onClose }) => {

    const typeLabel: Record<NoParkingRoute["type"], string> = {
        "no parking": "Cấm đỗ",
        "no stopping": "Cấm dừng",
        "alternate days": "Cấm đỗ chẵn lẻ",
    };

    const typeSide: Record<NoParkingRoute["side"], string> = {
        "odd": "Bên lẻ",
        "even": "Bên chẵn",
        "both": "Cả hai bên",
    };

    const formatDaysRestricted = (days: string[]): string => {
        const allDays = [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
        ];

        // Nếu đủ cả 7 ngày thì coi là "Cả tuần"
        if (days.length === allDays.length && allDays.every(d => days.includes(d))) {
            return "Cả tuần";
        }

        // Map từ tiếng Anh sang T2, T3,...
        const dayMap: Record<string, string> = {
            Monday: "T2",
            Tuesday: "T3",
            Wednesday: "T4",
            Thursday: "T5",
            Friday: "T6",
            Saturday: "T7",
            Sunday: "CN",
        };

        return days.map((d) => dayMap[d] || d).join(", ");
    };

    const typeIcons: Record<NoParkingRoute["type"], any> = {
        "no parking": icons.banParking,
        "no stopping": icons.banStopping,
        "alternate days": icons.banOddEven, // tạm thời dùng icon cấm chẵn lẻ
    };




    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (route) {
            // Fade in
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500, // 👈 chỉnh thời gian tại đây
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
            <View className="flex-1 justify-center items-center bg-black/30 w-full h-full">
                <View className="bg-white rounded-2xl p-6 w-4/5">
                    {route ? (
                        <View className="w-full">
                            <View className="flex items-center justify-center gap-3">
                                {route.type === "alternate days" ? (
                                    <View className="flex-row gap-2">
                                        <Image
                                            source={icons.banDayOdd}
                                            style={{ width: 40, height: 40 }}
                                            resizeMode="contain"
                                        />
                                        <Image
                                            source={icons.banDayEven}
                                            style={{ width: 40, height: 40 }}
                                            resizeMode="contain"
                                        />
                                    </View>
                                ) : (
                                    <Image
                                        source={typeIcons[route.type]}
                                        style={{ width: 40, height: 40 }}
                                        resizeMode="contain"
                                    />
                                )}

                                {/* Text block chiếm hết phần còn lại */}
                                <View className="flex items-center">
                                    <Text className="font-semibold text-xl text-center">{route.street}</Text>
                                    <Text className="text-lg text-gray-500">
                                        Loại: {route ? typeLabel[route.type] : ""}
                                    </Text>
                                </View>
                            </View>

                            {/* Thông tin chi tiết */}
                            <View className="mt-3 gap-2 w-4/5">
                                {/* Bên cấm */}
                                <View className="flex-row items-start gap-2">
                                    <View className="w-[30px] items-center">
                                        <IconSideParking size={24} color={Colors.blue_button} />
                                    </View>
                                    <Text className="flex-1">Bên cấm: {route ? typeSide[route.side] : ""}</Text>
                                </View>

                                {/* Thời gian cấm */}
                                <View className="flex-row items-start gap-2">
                                    <View className="w-[30px] items-center">
                                        <IconClock size={24} color={Colors.blue_button} />
                                    </View>
                                    <View className="flex-1 flex-row flex-wrap">
                                        <Text>Thời gian cấm: </Text>
                                        <Text className="flex-shrink">
                                            {route?.time_range
                                                ?.map((r) => `${r.start.slice(0, 5)} - ${r.end.slice(0, 5)}`)
                                                .join(", ")}
                                        </Text>
                                    </View>
                                </View>

                                {/* Ngày cấm */}
                                <View className="flex-row items-start gap-2">
                                    <View className="w-[30px] items-center">
                                        <IconCalendar size={24} color={Colors.blue_button} />
                                    </View>
                                    <Text className="flex-1">
                                        Ngày cấm: {formatDaysRestricted(route.days_restricted)}
                                    </Text>
                                </View>

                                {/* Mô tả */}
                                <View className="flex-row items-start gap-2">
                                    <View className="w-[30px] items-center">
                                        <IconNote size={24} color={Colors.blue_button} />
                                    </View>
                                    <Text className="flex-1">Mô tả: {route.description || "Không có"}</Text>
                                </View>
                            </View>

                        </View>
                    ) : null}


                    {/* Nút đóng */}
                    <Pressable
                        onPress={onClose}
                        className="bg-gray-300 w-full h-[40px] mt-4 rounded-xl self-center justify-center items-center"
                    >
                        <Text className="text-black text-center font-semibold">Đóng</Text>
                    </Pressable>
                </View>
            </View>

        </Modal>
    );
};

export default NoParkingRouteModal;
