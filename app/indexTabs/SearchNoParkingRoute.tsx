import React, { useEffect, useState, useCallback, use } from "react";
import {
    ActivityIndicator,
    FlatList,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Image,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import GradientButton from "@/components/GradientButton";
import { images } from "@/constants/images";
import { useDebounce } from "@/hooks/useDebounce";
import { DEFAULT_TAB_BAR_STYLE } from "@/utils/tabBarStyle";
import { useSmartMapboxLocation } from "@/hooks/usePeriodicMapboxLocation";
import { useSearchNoParkingRoute } from "@/hooks/useSearchNoParkingRoute";
import Colors from "@/constants/colors";
import { IconCalendar, IconClock, IconDistance, IconNote, IconSideParking } from "@/components/Icons";
import { max } from "lodash";
import { maxLengthSearch } from "@/utils/ui";

const SearchNoParkingRoute = () => {
    const navigation = useNavigation<any>();
    const location = useSmartMapboxLocation();
    // Ẩn tab bar
    useEffect(() => {
        navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
        return () => {
            navigation.getParent()?.setOptions({ tabBarStyle: DEFAULT_TAB_BAR_STYLE });
        };
    }, [navigation]);

    const [query, setQuery] = useState("");
    const debouncedQuery = useDebounce(query.trim(), 500);
    const [isFocused, setIsFocused] = useState(false);

    const { noParkingRoutes, loading, fetchNoParkingRoutes, hasMore, resetSearch } = useSearchNoParkingRoute();

    const [loadingMore, setLoadingMore] = useState(false);
    const [loadingReset, setLoadingReset] = useState(false);
    const [isLocationReady, setIsLocationReady] = useState(false);

    const sideLabel: Record<"both" | "odd" | "even", string> = {
        "odd": "Bên lẻ",
        "even": "Bên chẵn",
        "both": "Cả hai bên",
    };

    const typeLabel: Record<"no parking" | "no stopping" | "alternate days", string> = {
        "no parking": "Cấm đỗ",
        "no stopping": "Cấm dừng",
        "alternate days": "Cấm đỗ chẵn lẻ",
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

    // ===============================
    // Fetch mỗi khi query location thay đổi
    // ===============================
    useEffect(() => {
        if (location) {
            console.log("📍 Đã có location:", location);
            setIsLocationReady(true);
        }
    }, [location]);

    useEffect(() => {
        if (!location) return;

        if (debouncedQuery === "") {
            resetSearch();
            fetchNoParkingRoutes("", true, location);
            return;
        }

        fetchNoParkingRoutes(debouncedQuery, true, location);
    }, [debouncedQuery, location]);

    // ===============================
    // Load thêm
    // ===============================
    const handleLoadMore = async () => {
        if (!location || loadingMore) return;
        setLoadingMore(true);
        await fetchNoParkingRoutes(
            debouncedQuery,
            false,
            location
        );
        setLoadingMore(false);
    };

    // ===============================
    // Reset danh sách (rút gọn)
    // ===============================
    const handleReset = async () => {
        if (!location || loadingReset) return;
        setLoadingReset(true);
        await fetchNoParkingRoutes(
            debouncedQuery,
            true,
            location
        );
        setLoadingReset(false);
    };

    // ===============================
    // Render
    useFocusEffect(
        useCallback(() => {
            // Khi vào lại tab, fetch lại danh sách
            if (location) {
                fetchNoParkingRoutes(
                    debouncedQuery,
                    true,
                    location
                );
            }
        }, [debouncedQuery, location])
    );
    if (!isLocationReady) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text className="mt-2 text-gray-500">Đang lấy vị trí của bạn...</Text>
            </View>
        );
    }
    // ===============================
    return (
        <View className="flex-1 bg-white px-4 pt-4">
            {/* Search */}
            <View className="flex-row w-full items-center gap-2">
                <View
                    className={`flex-1 rounded-lg h-[45px] ${isFocused ? "border-2 border-red-500" : "border border-gray-300"
                        }`}
                >
                    <TextInput
                        className="px-3 bg-gray-100 text-base rounded-lg h-full"
                        placeholder="Nhập tên tuyến đường..."
                        value={query}
                        onChangeText={setQuery}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        maxLength={maxLengthSearch}
                    />
                </View>
            </View>

            {/* Danh sách */}
            {loading && noParkingRoutes.length === 0 ? (
                <View className="flex-1 justify-center items-center mt-10">
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <FlatList
                    className="mt-4"
                    data={noParkingRoutes}
                    keyExtractor={(item) => item.no_parking_route_id.toString()}
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            className="py-4 border-b border-gray-200 w-full"
                            onPress={() => {
                                navigation.reset({
                                    index: 0,
                                    routes: [
                                        {
                                            name: "Tabs",
                                            state: {
                                                routes: [
                                                    {
                                                        name: "NoParkingRoute",
                                                        params: {
                                                            selectedNoParkingRouteId: item.no_parking_route_id,
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                });
                            }}

                        >
                            <View className="flex">
                                <View className="mb-1">
                                    <Text className="text-lg font-bold text-gray-900">{item.street}</Text>
                                    <Text className="text-sm text-gray-600">Loại cấm: {typeLabel[item.type as keyof typeof typeLabel] ?? "Không xác định"}</Text>
                                </View>

                                <View className="flex-row items-center mt-1 flex-wrap gap-2">
                                    <View className="flex-row items-center">
                                        <IconDistance size={20} color={Colors.blue_button} />
                                        <Text className="ml-1 text-sm text-gray-500">
                                            {item.distance !== undefined ? `${(item.distance / 1000).toFixed(2)} km` : "Chưa xác định"}
                                        </Text>
                                    </View>
                                    <View className="w-[2px] h-4 bg-gray-300 mx-2 rounded-full" />
                                    <View className="flex-row items-center">
                                        <IconSideParking size={20} color={Colors.blue_button} />
                                        <Text className="ml-1 text-sm text-gray-500">Bên cấm: {sideLabel[item.side as keyof typeof sideLabel] ?? "Không xác định"}</Text>
                                    </View>
                                    <View className="w-[2px] h-4 bg-gray-300 mx-2 rounded-full" />

                                    <View className="flex-row items-center">
                                        <IconClock size={20} color={Colors.blue_button} />
                                        <Text className="ml-1 text-sm text-gray-500">
                                            {item?.time_range
                                                .map((r) => `${r.start.slice(0, 5)} - ${r.end.slice(0, 5)}`)
                                                .join(", ")}
                                        </Text>
                                    </View>
                                    <View className="w-[2px] h-4 bg-gray-300 mx-2 rounded-full" />

                                    <View className="flex-row items-center">
                                        <IconCalendar size={20} color={Colors.blue_button} />
                                        <Text className="ml-1 text-sm text-gray-500">
                                            Ngày cấm: {formatDaysRestricted(item.days_restricted)}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <View className="flex-1 justify-center items-center mt-20">
                            <Image source={images.noData} style={{ width: 150, height: 150, resizeMode: "contain" }} />
                            <Text className="mt-3 text-lg text-gray-500 text-center">Không có dữ liệu</Text>
                        </View>
                    }
                    ListHeaderComponent={
                        noParkingRoutes.length > 0 ? (
                            <View className="flex-row justify-between mb-1 flex-wrap items-center gap-2">
                                <Text className="font-semibold text-xl text-gray-900">Danh sách tuyến cấm</Text>
                                <Text className="text-sm text-gray-500 mt-1">{noParkingRoutes.length} tuyến cấm được tìm thấy</Text>
                            </View>
                        ) : null
                    }
                    ListFooterComponent={
                        noParkingRoutes.length > 0 ? (
                            <View className="mt-4 pb-6">
                                {noParkingRoutes.length > 5 &&
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

        </View>
    );
};

export default SearchNoParkingRoute;
