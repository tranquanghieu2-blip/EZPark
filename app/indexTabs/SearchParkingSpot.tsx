import { IconDistance, IconFilter, IconStar, IconParkingSpotType } from "@/components/Icons";
import Colors from "@/constants/colors";
import { images } from "@/constants/images";
import { useDebounce } from "@/hooks/useDebounce";
import { useSearchParking } from "@/hooks/useSearchParking";
import FilterModal from "@/modals/FilterModal";
import { DEFAULT_TAB_BAR_STYLE } from "@/utils/tabBarStyle";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useLayoutEffect, useState } from "react";
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
import GradientButton from "@/components/GradientButton";

const SearchParkingSpot = () => {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.getParent()?.setOptions({
      tabBarStyle: { display: "none" },
    });
    return () => {
      navigation.getParent()?.setOptions({
        tabBarStyle: DEFAULT_TAB_BAR_STYLE,
      });
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

  const [filters, setFilters] = useState<{ criteria: string[]; parkingType?: string }>({
    criteria: [],
    parkingType: undefined,
  });

  // Search khi query hoặc filter thay đổi
  useEffect(() => {
    if (debouncedQuery.trim()) {
      fetchSpots(
        debouncedQuery,
        true,
        filters.parkingType ? typeLabel2[filters.parkingType] : undefined
      );
    } else {
      resetSearch();
    }
  }, [debouncedQuery, filters]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await fetchSpots(
      debouncedQuery,
      false,
      filters.parkingType ? typeLabel2[filters.parkingType] : undefined
    );
    setLoadingMore(false);
  };

  const handleReset = async () => {
    setLoadingReset(true);
    await fetchSpots(
      debouncedQuery,
      true,
      filters.parkingType ? typeLabel2[filters.parkingType] : undefined
    );
    setLoadingReset(false);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView className="flex-1 bg-white px-4">
        {/* Search + Filter */}
        <View className="flex-row w-full items-center space-x-2 gap-2">
          <View
            className={`flex-1 rounded-lg h-[50px] ${isFocused ? "border-2 border-red-500" : "border border-gray-300"
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
            className="w-[50px] h-[50px] rounded-xl overflow-hidden"
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
          <ActivityIndicator className="mt-10" />
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
                  console.log("Chọn bãi:", item.name);
                  navigation.goBack();
                }}
              >
                <View className="flex">
                  {/* Tên + Địa chỉ */}
                  <View className="mb-1">
                    <Text className="text-lg font-bold text-gray-900">{item.name}</Text>
                    <Text className="text-sm text-gray-600">{item.address}</Text>
                  </View>

                  {/* Distance + Rating + Type */}
                  <View className="flex-row items-center mt-1">
                    {/* Distance */}
                    <View className="flex-row items-center">
                      <IconDistance size={20} color={Colors.blue_button} />
                      <Text className="ml-1 text-sm text-gray-500">
                        {item.distance?.toFixed(2)} km
                      </Text>
                    </View>

                    {/* Divider */}
                    <View className="w-[2px] h-4 bg-gray-300 mx-4 rounded-full" />

                    {/* Rating */}
                    <View className="flex-row items-center gap-1">
                      <Text className="text-sm font-medium text-gray-700">4.8</Text>
                      <IconStar size={18} color={Colors.star} />
                      <Text className="text-sm text-gray-500">(1024)</Text>
                    </View>

                    {/* Divider */}
                    <View className="w-[2px] h-4 bg-gray-300 mx-4 rounded-full" />

                    {/* Type */}
                    <View className="flex-row items-center">
                      <IconParkingSpotType size={20} color={Colors.blue_button} />
                      <Text className="ml-1 text-sm text-gray-500">{typeLabel[item.type]}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View className="flex-1 justify-center items-center">
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
                  {/* Nút rút gọn */}
                  {spots.length > 5 && (
                    loadingReset ? (
                      <ActivityIndicator />
                    ) : (
                      // Khi không loading: show nút Rút gọn
                      <TouchableOpacity
                        className="mb-3 bg-gray-200 rounded-lg h-[45px] justify-center items-center"
                        onPress={handleReset}
                        disabled={loadingReset}
                      >
                        <Text className="text-black font-medium">Rút gọn</Text>
                      </TouchableOpacity>
                    )
                  )}


                  {/* Nút load thêm */}
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
            });
            fetchSpots(
              debouncedQuery,
              true,
              selectedFilters.parkingType ? typeLabel2[selectedFilters.parkingType] : undefined
            );
          }}
        />
      </SafeAreaView >
    </TouchableWithoutFeedback>

  );
};

export default SearchParkingSpot;
