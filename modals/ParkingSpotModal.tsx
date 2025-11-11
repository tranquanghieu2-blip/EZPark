import {
  IconCar,
  IconFavorite,
  IconParking,
  IconParkingSpotType,
  IconPredict,
  IconsMap,
  IconStar,
} from '@/components/Icons';
import Colors from '@/constants/colors';
import { getRoutes } from '@/service/routingService';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  View,
  ScrollView,
} from 'react-native';

import { Linking } from 'react-native';
interface Props {
  visible: boolean;
  onClose: () => void;
  loading: boolean;
  error: Error | null;
  detail: ParkingSpotDetailWithStats | null;
  showInstructionModal: boolean;
  showDropdown: boolean;
  currentLocation?: { latitude: number; longitude: number } | null;
  onRouteFound?: (coords: { latitude: number; longitude: number }[][]) => void;
  onSetShowInstructionModal?: (show: boolean) => void;
  onSetShowDropdown?: (show: boolean) => void;
}

const typeLabel: Record<ParkingSpotDetail['type'], string> = {
  'parking hub': 'Bãi đỗ xe tập trung',
  'on street parking': 'Đỗ xe ven đường',
};

const ParkingSpotDetailModal: React.FC<Props> = ({
  visible,
  onClose,
  loading,
  error,
  detail,
  showInstructionModal,
  showDropdown,
  currentLocation,
  onRouteFound,
  onSetShowInstructionModal, // ← Destructure callbacks
  onSetShowDropdown,
}) => {
  const navigation = useNavigation<any>();
  const [distance, setDistance] = useState<string | null>(null);

  const formatMeters = (m?: number) => {
    if (!m) return '';
    if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
    return `${Math.round(m)} m`;
  };

  const formatDuration = (s?: number) => {
    if (!s) return '';
    const mins = Math.round(s / 60);
    return mins > 60
      ? `${Math.floor(mins / 60)}h ${mins % 60}m`
      : `${mins} phút`;
  };

  const openGoogleMaps = (latitude: number, longitude: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    Linking.openURL(url).catch(err =>
      console.error('Không thể mở Google Maps:', err),
    );
  };

  return (
    <>
      {/* Modal chi tiết bãi đỗ */}
      <Modal visible={visible} animationType="fade" transparent>
        <View className="flex-1 justify-center items-center bg-black/30">
          <View className="bg-white rounded-2xl p-6 w-4/5">
            {loading ? (
              <ActivityIndicator size="large" color={Colors.blue_button} />
            ) : error ? (
              <Text>Lỗi: {error.message}</Text>
            ) : detail ? (
              <View>
                <Text className="font-semibold text-xl text-center mb-2">
                  {detail.name}
                </Text>
                {/* Distance */}
                <View className="w-fit self-center">

                  <Text className="text-base text-center bg-gray-200 w-fit px-4 py-1 rounded-full mt-2">
                    {detail.distance !== null
                      ? `${detail.distance} km`
                      : 'Khoảng cách không xác định'}
                  </Text>

                </View>

                <View className="flex-row items-center gap-1 justify-center mt-3">
                  {detail.statistics ? (
                    <>
                      <Text className="text-sm font-medium text-gray-700">
                        {detail.statistics.avgRating.toFixed(1)}
                      </Text>
                      {/* <RatingStars value={detail.statistics.avgRating} size={16} /> */}
                      <IconStar size={16} color={Colors.star} />
                      <Text className="text-sm text-gray-500">({detail.statistics.totalReviews})</Text>
                    </>
                  ) : (
                    <ActivityIndicator size="small" />
                  )}
                </View>

                {/* Info */}
                <View className="mt-3 flex gap-2">
                  {/* Địa chỉ */}
                  <View className="flex-row items-center gap-2">
                    <View className="w-[30px] items-center">
                      <IconsMap size={24} color={Colors.blue_button} />
                    </View>
                    <Text className="flex-1">{detail.address}</Text>
                  </View>

                  {/* Số chỗ */}
                  <View className="flex-row items-center gap-2">
                    <View className="w-[30px] items-center">
                      <IconCar size={24} color={Colors.blue_button} />
                    </View>
                    <Text className="flex-1">Tổng số chỗ: {detail.capacity}</Text>
                  </View>

                  {/* Loại bãi đỗ */}
                  <View className="flex-row items-center gap-2">
                    <View className="w-[30px] items-center">
                      <IconParkingSpotType size={24} color={Colors.blue_button} />
                    </View>
                    <Text className="flex-1">Loại: {typeLabel[detail.type]}</Text>
                  </View>

                  {detail.predictionData && (
                    <View className="flex-row items-center gap-2">
                      <View className="w-[30px] items-center">
                        <IconPredict size={24} color={Colors.blue_button} />
                      </View>
                      <Text className="flex-1">Dự đoán còn {detail.predictionData.prediction.availability_percentage} chỗ trống</Text>
                    </View>
                  )}
                </View>


                <Pressable
                  onPress={() => {
                    onClose();
                    navigation.navigate('ParkingSpotDetail', {
                      spot: detail, from: "ParkingSpotModal"
                    });
                  }}
                >
                  <Text className="text-blue-600 underline mt-3 text-center">
                    Xem chi tiết
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Text>Không có dữ liệu</Text>
            )}

            {/* Buttons */}
            <View className="flex-row justify-center w-full gap-2">
              <Pressable
                onPress={() => {
                  onClose();
                  setDistance(null);
                }}
                className="bg-gray-300 active:bg-gray-200 flex-1 h-[40px] px-4 py-2 mt-4 rounded-xl self-center justify-center items-center"
              >
                <Text className="text-black text-center font-semibold">
                  Đóng
                </Text>
              </Pressable>

              <Pressable
                // onPress={() => {
                //   if (detail && currentLocation) {
                //     getRoutes(
                //       [currentLocation.longitude, currentLocation.latitude],
                //       [detail.longitude, detail.latitude],
                //     )
                //       .then(routes => {
                //         if (routes && routes.length > 0) {
                //           const main = routes[0];
                //           if (main.instructions) {
                //             setInstructions(main.instructions);
                //           }

                //           if (onRouteFound) {
                //             const coords = routes.map((r: any) =>
                //               r.geometry.coordinates.map(
                //                 ([lon, lat]: [number, number]) => ({
                //                   longitude: lon,
                //                   latitude: lat,
                //                 }),
                //               ),
                //             );
                //             onRouteFound(coords);
                //           }
                //           // Hiện dropdown sau khi có route
                //           onSetShowDropdown?.(true);
                //         }
                //         onClose();
                //       })
                //       .catch(err => console.error('Route error:', err));
                //   }
                // }}
                onPress={() => {
                  if (detail) {
                    openGoogleMaps(detail.latitude, detail.longitude);
                  }
                }}
                className="bg-blue-600 active:bg-blue-700 flex-1 h-[40px] px-4 py-2 mt-4 rounded-xl self-center justify-center items-center"
              >
                <Text className="text-white text-center font-semibold">
                  Chỉ đường
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Dropdown modal */}
      {showDropdown && (
        <View className="absolute top-[80px] left-3 w-[200px] bg-white rounded-xl shadow-lg p-2 border border-gray-200 z-50">
          <Text className="font-semibold text-lg text-black mb-2 text-center">
            Chỉ đường chi tiết
          </Text>

          <Pressable
            onPress={() => onSetShowInstructionModal?.(true)}
            className="bg-blue-500 active:bg-blue-600 py-2 rounded-lg"
          >
            <Text className="text-white text-center font-semibold =">
              Xem hướng dẫn
            </Text>
          </Pressable>

          <Pressable
            onPress={() => onSetShowDropdown?.(false)}
            className="mt-2 bg-gray-300 active:bg-gray-500 py-2 rounded-lg"
          >
            <Text className="text-center font-semibold text-gray-700">
              Đóng
            </Text>
          </Pressable>
        </View>
      )}


    </>
  );
};

export default ParkingSpotDetailModal;
