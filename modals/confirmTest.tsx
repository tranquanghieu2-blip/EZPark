import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Modal, Pressable, Text, View } from 'react-native';
import { IconClock } from '@/components/Icons';
import Colors from '@/constants/colors';
import { useConfirmedParking } from '@/hooks/useConfirmParking';
import { isUserOnRoute} from '@/hooks/Helper/UseConfirmParkringHelper';
import { getAllowedTimeRanges } from '@/utils/time';
import  {usePeriodicMapboxLocation}  from '@/hooks/usePeriodicMapboxLocation';



interface Props {
  onClose: () => void;
  route: NoParkingRoute | null;
}

const ConfirmTest: React.FC<Props> = ({ route, onClose }) => {
  const location = usePeriodicMapboxLocation(5000);
  const { confirmed, confirmRoute, clearConfirmed } = useConfirmedParking();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  console.log("route", route?.route.coordinates);
  console.log("Location:", location);



  const canConfirmOnRoute = route && location && isUserOnRoute(
    location.latitude,
    location.longitude,
    route.route?.coordinates || [],
    50
  );

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: route ? 1 : 0,
      duration: route ? 500 : 200,
      useNativeDriver: true,
    }).start();
  }, [route]);

  const handleConfirm = async () => {
    if (!route) return;
    if (!canConfirmOnRoute) {
      Alert.alert('Không thể xác nhận', 'Bạn cần ở gần tuyến đường để xác nhận.');
      return;
    }
    if (confirmed?.routeId === route.no_parking_route_id) {
      Alert.alert('Đã xác nhận', 'Bạn đã xác nhận đỗ tại tuyến đường này rồi.');
      return;
    }

    await confirmRoute({
      routeId: route.no_parking_route_id,
      street: route.street,
      confirmedLat: location.latitude,
      confirmedLon: location.longitude,
      route: route.route?.coordinates || [],
    });

    onClose();
  };

  const handleCancelConfirm = async () => {
    await clearConfirmed();
    Alert.alert('Đã hủy xác nhận', 'Thông báo đỗ xe đã được hủy.');
    onClose();
  };

  const isConfirmedHere = confirmed?.routeId === route?.no_parking_route_id;

  try {
    return (
      <Modal transparent visible={!!route} animationType="fade" onRequestClose={onClose}>
        <View className="flex-1 justify-center items-center bg-black/30 w-full h-full">
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [
                {
                  scale: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                },
              ],
            }}
            className="bg-white rounded-2xl p-6 w-4/5"
          >
            <Text className="font-semibold text-xl text-center mb-1">Xác Nhận Đỗ Xe</Text>
            <Text className="font-regular text-base text-center mb-3">
              Hãy xác nhận đỗ xe để nhận thông báo cảnh báo tự động
            </Text>

            {route && (
              <View className="items-center">
                <Text className="font-regular text-lg mb-2">
                  Tuyến đường {route.street}
                </Text>

                <View className="flex-row w-full gap-2 mt-2">
                  <Pressable
                    onPress={onClose}
                    className="bg-gray-200 flex-1 h-[40px] rounded-xl justify-center items-center"
                  >
                    <Text className="text-black font-semibold">Đóng</Text>
                  </Pressable>

                  {!isConfirmedHere ? (
                    <Pressable
                      disabled={!canConfirmOnRoute}
                      onPress={handleConfirm}
                      className={`flex-1 h-[40px] rounded-xl justify-center items-center ${
                        canConfirmOnRoute ? 'bg-blue-500' : 'bg-gray-400'
                      }`}
                    >
                      <Text className="text-white font-semibold">Xác nhận đỗ</Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={handleCancelConfirm}
                      className="flex-1 h-[40px] rounded-xl justify-center items-center bg-red-500"
                    >
                      <Text className="text-white font-semibold">Hủy xác nhận</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>
    );
  } catch (error) {
    console.error('Error in ConfirmTest component:', error);
    return (
      <Modal visible={!!route} transparent onRequestClose={onClose}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Có lỗi xảy ra</Text>
        </View>
      </Modal>
    );
  }
};

export default ConfirmTest;
