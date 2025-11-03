import { IconParking, IconParkingSpotType, IconsMap } from '@/components/Icons';
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

interface Props {
  visible: boolean;
  onClose: () => void;
  loading: boolean;
  error: Error | null;
  detail: ParkingSpotDetail | null;
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
  const navigation = useNavigation();
  const [distance, setDistance] = useState<string | null>(null);
  const [distanceLoading, setDistanceLoading] = useState(false);

  // Modal chỉ dẫn turn-by-turn
  const [instructions, setInstructions] = useState<
    { instruction: string; distance?: number; duration?: number }[]
  >([]);

  useEffect(() => {
    if (detail && currentLocation) {
      setDistanceLoading(true);
      setDistance(null);
      getRoutes(
        [currentLocation.longitude, currentLocation.latitude],
        [detail.longitude, detail.latitude],
      )
        .then(routes => {
          if (routes && routes.length > 0) {
            const mainRoute = routes[0];
            const distanceKm = (mainRoute.distance / 1000).toFixed(2);
            setDistance(`${distanceKm} km`);
          }
        })
        .catch(err => {
          console.error('Route error:', err);
          setDistance(null);
        })
        .finally(() => setDistanceLoading(false));
    } else {
      setDistance(null);
      setDistanceLoading(false);
    }
  }, [detail, currentLocation]);

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
                <Text className="font-semibold text-xl text-center">
                  {detail.name}
                </Text>

                {/* Distance */}
                <View className="w-fit self-center">
                  {distanceLoading ? (
                    <View className="bg-gray-200 px-4 py-1 rounded-full mt-2 flex-row items-center justify-center min-w-[80px]">
                      <ActivityIndicator
                        size="small"
                        color={Colors.blue_button}
                      />
                    </View>
                  ) : distance ? (
                    <Text className="text-base text-center bg-gray-200 w-fit px-4 py-1 rounded-full mt-2">
                      {distance}
                    </Text>
                  ) : (
                    <Text className="text-base text-center bg-gray-200 w-fit px-4 py-1 rounded-full mt-2 text-gray-500">
                      Không xác định
                    </Text>
                  )}
                </View>

                {/* Info */}
                <View className="mt-3 flex gap-2 w-4/5">
                  <View className="flex-row items-center gap-3">
                    <IconsMap size={24} color={Colors.blue_button} />
                    <Text>{detail.address}</Text>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <IconParking size={24} color={Colors.blue_button} />
                    <Text>Tổng số chỗ: {detail.capacity}</Text>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <IconParkingSpotType size={24} color={Colors.blue_button} />
                    <Text>Loại: {typeLabel[detail.type]}</Text>
                  </View>
                </View>

                <Pressable>
                  <Text className="text-blue-500 underline mt-3 text-center">
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
                onPress={() => {
                  if (detail && currentLocation) {
                    getRoutes(
                      [currentLocation.longitude, currentLocation.latitude],
                      [detail.longitude, detail.latitude],
                    )
                      .then(routes => {
                        if (routes && routes.length > 0) {
                          const main = routes[0];
                          if (main.instructions) {
                            setInstructions(main.instructions);
                          }

                          if (onRouteFound) {
                            const coords = routes.map((r: any) =>
                              r.geometry.coordinates.map(
                                ([lon, lat]: [number, number]) => ({
                                  longitude: lon,
                                  latitude: lat,
                                }),
                              ),
                            );
                            onRouteFound(coords);
                          }
                          // Hiện dropdown sau khi có route
                          onSetShowDropdown?.(true);
                        }
                        onClose();
                      })
                      .catch(err => console.error('Route error:', err));
                  }
                }}
                className="bg-blue-500 active:bg-blue-600 flex-1 h-[40px] px-4 py-2 mt-4 rounded-xl self-center justify-center items-center"
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

      {/* Modal chỉ dẫn nhỏ ở góc trái */}
      {showInstructionModal && (
        <View className="absolute top-[160px] left-3 w-[250px] max-h-[300px] bg-white rounded-xl shadow-lg p-3 border border-gray-200 z-50">
          <ScrollView showsVerticalScrollIndicator={false}>
            {instructions.length > 0 ? (
              instructions.map((step, i) => (
                <View key={i} className="mb-2">
                  <Text className="font-medium text-gray-800">
                    {i + 1}. {step.instruction}
                  </Text>
                  <Text className="text-xs text-gray-500 ">
                    {formatMeters(step.distance)} -{' '}
                    {formatDuration(step.duration)}
                  </Text>
                </View>
              ))
            ) : (
              <Text className="text-gray-500">Không có chỉ dẫn.</Text>
            )}
          </ScrollView>

          <Pressable
            onPress={() => onSetShowInstructionModal?.(false)}
            className="mt-3 bg-blue-500 py-1.5 rounded-lg active:bg-blue-600"
          >
            <Text className="text-white text-center font-semibold">Đóng</Text>
          </Pressable>
        </View>
      )}
    </>
  );
};

export default ParkingSpotDetailModal;
