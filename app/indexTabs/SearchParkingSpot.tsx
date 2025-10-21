import React, { useCallback, useEffect, useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
  IconDistance,
  IconFilter,
  IconStar,
  IconParkingSpotType,
  IconStarNo,
  IconStarHalf,
} from "@/components/Icons";
import GradientButton from "@/components/GradientButton";
import FilterModal from "@/modals/FilterModal";
import Colors from "@/constants/colors";
import { images } from "@/constants/images";
import { useDebounce } from "@/hooks/useDebounce";
import { useSearchParking } from "@/hooks/useSearchParking";
import { DEFAULT_TAB_BAR_STYLE } from "@/utils/tabBarStyle";
import { useSmartMapboxLocation } from "@/hooks/usePeriodicMapboxLocation";

// Hiển thị hàng sao
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
    stars.push(<IconStarNo key={`empty-${i}`} size={size} color={Colors.star_no} />);
  }

  return <View className="flex-row items-center">{stars}</View>;
};

const SearchParkingSpot = () => {
  const navigation = useNavigation<any>();
  const location = useSmartMapboxLocation(); // lấy tọa độ mỗi 5s

  useLayoutEffect(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
    return () => {
      navigation.getParent()?.setOptions({ tabBarStyle: DEFAULT_TAB_BAR_STYLE });
    };
  }, [navigation]);

  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const debouncedQuery = useDebounce(query, 500);

  const { spots, loading, fetchSpots, resetSearch, hasMore } = useSearchParking();

  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);

  const typeLabel: Record<"parking hub" | "on street parking", string> = {
    "parking hub": "Bãi đỗ xe tập trung",
    "on street parking": "Đỗ xe ven đường",
  };

  const typeLabel2: Record<string, string> = {
    "Bãi đỗ xe tập trung": "parking hub",
    "Đỗ xe ven đường": "on street parking",
  };

  const [filters, setFilters] = useState<{ criteria: string[]; parkingType?: string; selectedRating?: number | null }>({
    criteria: [],
    parkingType: undefined,
    selectedRating: null,
  });

  // Tự động tìm khi query hoặc filter thay đổi
  useEffect(() => {
    if (!location) {
      console.log("⚠️ Chưa có vị trí người dùng, chưa thể tìm kiếm...");
      return;
    }

    if (debouncedQuery.trim()) {
      fetchSpots(
        debouncedQuery,
        true,
        filters.parkingType ? typeLabel2[filters.parkingType] : undefined,
        filters.selectedRating ?? undefined,
        location
      );
    } else {
      resetSearch();
    }
  }, [debouncedQuery, filters, location]);



  const handleLoadMore = async () => {
    if (!location) return;
    setLoadingMore(true);
    await fetchSpots(
      debouncedQuery,
      false,
      filters.parkingType ? typeLabel2[filters.parkingType] : undefined,
      filters.selectedRating ?? undefined,
      location
    );
    setLoadingMore(false);
  };

  const handleReset = async () => {
    if (!location) return;
    setLoadingReset(true);
    await fetchSpots(
      debouncedQuery,
      true,
      filters.parkingType ? typeLabel2[filters.parkingType] : undefined,
      filters.selectedRating ?? undefined,
      location
    );
    setLoadingReset(false);
  };

  // chạy mỗi khi màn hình focus lại
  useFocusEffect(
    useCallback(() => {
      console.log("Query:", debouncedQuery, "Filters:", filters, "Location:", location);
      if (!location) return;
      fetchSpots(
        debouncedQuery,
        true,
        filters.parkingType ? typeLabel2[filters.parkingType] : undefined,
        filters.selectedRating ?? undefined,
        location
      );
    }, [debouncedQuery, filters.parkingType, location]) // <- IMPORTANT
  );


  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView className="flex-1 bg-white px-4">
        {/* Search + Filter */}
        <View className="flex-row w-full items-center space-x-2 gap-2">
          <View
            className={`flex-1 rounded-lg h-[45px] ${isFocused ? "border-2 border-red-500" : "border border-gray-300"
              }`}
          >
            <TextInput
              className="px-3 bg-gray-100 text-base rounded-lg h-full"
              placeholder="Nhập tên bãi đỗ hoặc địa chỉ..."
              value={query}
              onChangeText={setQuery}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
          </View>

          <TouchableOpacity
            onPress={() => setShowModal(true)}
            className="w-[45px] h-[45px] rounded-xl overflow-hidden"
          >
            <ImageBackground
              source={images.bottomNavItem}
              className="w-full h-full justify-center items-center"
            >
              <IconFilter size={22} color="#fff" />
            </ImageBackground>
          </TouchableOpacity>
        </View>

        {/* Danh sách */}
        {loading && spots.length === 0 ? (
          <View className="flex-1 justify-center items-center mt-10">
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <FlatList
            className="mt-4"
            data={spots}
            keyExtractor={(item) => item.parking_spot_id.toString()}
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                className="py-4 border-b border-gray-200"
                onPress={() => {
                  navigation.navigate("ParkingSpotDetail", { spot: item });
                }}
              >
                <View className="flex">
                  <View className="mb-1">
                    <Text className="text-lg font-bold text-gray-900">{item.name}</Text>
                    <Text className="text-sm text-gray-600">{item.address}</Text>
                  </View>

                  <View className="flex-row items-center mt-1">
                    <View className="flex-row items-center">
                      <IconDistance size={20} color={Colors.blue_button} />
                      <Text className="ml-1 text-sm text-gray-500">
                        {item.distance?.toFixed(2)} km
                      </Text>
                    </View>

                    <View className="w-[2px] h-4 bg-gray-300 mx-4 rounded-full" />

                    <View className="flex-row items-center gap-1">
                      {item.statistics ? (
                        <>
                          <Text className="text-sm font-medium text-gray-700">
                            {item.statistics.avgRating.toFixed(1)}
                          </Text>
                          <RatingStars value={item.statistics.avgRating} size={16} />
                          <Text className="text-sm text-gray-500">
                            ({item.statistics.totalReviews})
                          </Text>
                        </>
                      ) : (
                        <ActivityIndicator size="small" />
                      )}
                    </View>

                    <View className="w-[2px] h-4 bg-gray-300 mx-4 rounded-full" />

                    <View className="flex-row items-center">
                      <IconParkingSpotType size={20} color={Colors.blue_button} />
                      <Text className="ml-1 text-sm text-gray-500">
                        {typeLabel[item.type as keyof typeof typeLabel] ?? "Không xác định"}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={

              <View className="flex-1 justify-center items-center mt-20">
                <Image
                  source={images.noData}
                  style={{ width: 150, height: 150, resizeMode: "contain" }}
                />
                <Text className="mt-3 text-lg text-gray-500 text-center">
                  Không có dữ liệu
                </Text>
              </View>

            }
            ListHeaderComponent={
              spots.length > 0 ? (
                <View className="flex-row justify-between mb-2">
                  <Text className="font-semibold text-xl text-gray-900">
                    Danh sách bãi đỗ xe
                  </Text>
                  <Text className="text-sm text-gray-500 mt-1">
                    {spots.length} bãi đỗ được tìm thấy
                  </Text>
                </View>
              ) : null
            }
            ListFooterComponent={
              spots.length > 0 ? (
                <View className="mt-4 pb-6 flex-shrink-0">
                  {spots.length > 5 &&
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

        {/* Modal filter */}
        <FilterModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          onConfirm={(selectedFilters) => {
            setFilters({
              criteria: selectedFilters.criteria,
              parkingType: selectedFilters.parkingType || undefined,
              selectedRating: selectedFilters.selectedRating ?? null,
            });
            if (!location) return;
            fetchSpots(
              debouncedQuery,
              true,
              selectedFilters.parkingType
                ? typeLabel2[selectedFilters.parkingType]
                : undefined,
              filters.selectedRating ?? undefined,
              location
            );
          }}
        />
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default SearchParkingSpot;
