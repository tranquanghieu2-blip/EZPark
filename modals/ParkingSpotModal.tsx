import { IconParking, IconParkingSpotType, IconsMap } from '@/components/Icons';
import Colors from '@/constants/colors';
import { getRoute } from '@/service/routingService';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  loading: boolean;
  error: Error | null;
  detail: ParkingSpotDetail | null;
  currentLocation?: { latitude: number; longitude: number } | null;
  onRouteFound?: (coords: { latitude: number; longitude: number }[][]) => void;
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
  currentLocation,
  onRouteFound,
}) => {
  const navigation = useNavigation();
  const [distance, setDistance] = useState<string | null>(null);

  useEffect(() => {
    if (detail && currentLocation) {
      getRoute(
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
        });
    }
  }, [detail, currentLocation]);

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View className="flex-1 justify-center items-center bg-black/30">
        <View className="bg-white rounded-2xl p-6 w-4/5">
          {loading ? (
            <ActivityIndicator size="large" color={Colors.blue_button} />
          ) : error ? (
            <Text>Lỗi: {error.message}</Text>
          ) : detail ? (
            <View>
              <View>
                <Text className="font-semibold text-xl text-center">
                  {detail.name}
                </Text>
              </View>
              <View className="w-fit self-center">
                <Text className="text-base text-center bg-gray-200 w-fit px-4 py-1 rounded-full mt-2">
                  {distance}
                </Text>
              </View>

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

              {/* Nút điều hướng sang trang chi tiết */}
              <Pressable>
                <Text className="text-blue-500 underline mt-3 text-center">
                  Xem chi tiết
                </Text>
              </Pressable>
            </View>
          ) : (
            <Text>Không có dữ liệu</Text>
          )}
          <View className="flex-row justify-center w-full gap-2">
            <Pressable
              onPress={onClose}
              className="bg-gray-200 flex-1 h-[40px] px-4 py-2 mt-4 rounded-xl self-center justify-center items-center"
            >
              <Text className="text-black text-center font-semibold">Đóng</Text>
            </Pressable>
            <Pressable
              // onPress={() => {
              //   if (detail && currentLocation) {
              //     getRoute(
              //       [currentLocation.longitude, currentLocation.latitude],
              //       [detail.longitude, detail.latitude],
              //     )
              //       .then(route => {
              //         if (route) {
              //           if (onRouteFound) {
              //             const coords = route.geometry.coordinates.map(
              //               ([lon, lat]: [number, number]) => ({
              //                 latitude: lat,
              //                 longitude: lon,
              //               }),
              //             );
              //             onRouteFound(coords);
              //           }
              //         }
              //         onClose();
              //       })
              //       .catch(err => {
              //         console.error('Route error:', err);
              //       });
              //   }
              // }}
              onPress={() => {
                if (detail && currentLocation) {
                  getRoute(
                    [currentLocation.longitude, currentLocation.latitude],
                    [detail.longitude, detail.latitude],
                  )
                    .then(routes => {
                      if (routes && routes.length > 0 && onRouteFound) {
                        const allCoords = routes.map((r: any) =>
                          r.geometry.coordinates.map(
                            ([lon, lat]: [number, number]) => ({
                              longitude: lon,
                              latitude: lat,
                              
                            }),
                          ),
                        );
                        onRouteFound(allCoords); //  Truyền ra mảng 2 chiều
                        console.log("Route example:", allCoords[0].slice(0, 3));

                      }
                      
                      onClose();
                    })
                    .catch(err => console.error('Route error:', err));
                }
              }}
              className="bg-blue-500 flex-1 h-[40px] px-4 py-2 mt-4 rounded-xl self-center justify-center items-center"
            >
              <Text className="text-white text-center font-semibold">
                Chỉ đường
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ParkingSpotDetailModal;
