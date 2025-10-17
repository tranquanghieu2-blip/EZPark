import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Modal, Pressable, Text, View } from 'react-native';
import { IconClock } from '@/components/Icons';
import Colors from '@/constants/colors';
import {  useConfirmedParking } from '@/hooks/useConfirmParking';
import {isUserOnRoute} from '@/hooks/Helper/UseConfirmParkringHelper';
import { getAllowedTimeRanges } from '@/utils/time';
import notifee, { AndroidImportance, TriggerType } from '@notifee/react-native';
import {
  subscribeToRoute,
  unsubscribeFromRoute,
} from '@/service/fcm/fcmService';
import {usePeriodicMapboxLocation}  from '@/hooks/usePeriodicMapboxLocation';

interface Props {
  onClose: () => void;
  route: NoParkingRoute | null;
  scheduledNotificationIds?: string[];
}

const ConfirmParkingRoutesModal: React.FC<Props> = ({ route, onClose }) => {
  const location = usePeriodicMapboxLocation(5000);
  const { confirmed, confirmRoute } = useConfirmedParking();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [selectedConfirm, setselectedConfirm] = useState<number | null>(null);

  const canConfirmOnRoute = route && location && isUserOnRoute(
    location.latitude,
    location.longitude,
    route.route?.coordinates || [],
    10
  );

  const isAlreadyConfirmedOther =
    confirmed && confirmed.routeId !== route?.no_parking_route_id;

  // const disableConfirm = isAlreadyConfirmedOther || !canConfirmOnRoute;
  const disableConfirm =  !canConfirmOnRoute;

  // --- Hiệu ứng mờ khi hiển thị modal ---
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: route ? 1 : 0,
      duration: route ? 500 : 200,
      useNativeDriver: true,
    }).start();
  }, [route]);

  // --- Hàm xử lý xác nhận ---
  const handleConfirm = async () => {
    // if (!route || disableConfirm) {
    //   Alert.alert(
    //     'Không thể xác nhận',
    //     'Bạn cần ở gần tuyến đường hơn để xác nhận.',
    //   );
    //   return;
    // }
     if (!route) return;

    // Nếu không thể xác nhận vì quá xa
    // if (!canConfirmOnRoute) {
    //   Alert.alert('Quá xa', 'Bạn đang ở quá xa tuyến đường, không thể xác nhận.');
    //   return;
    // }

    const allowedRanges = getAllowedTimeRanges(route.time_range);
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA');

    const makeDateFromYMDAndTime = (ymd: string, timeStr: string) => {
      const [y, m, d] = ymd.split('-').map(Number);
      const [hour, minute, second] = timeStr.split(':').map(Number);
      return new Date(y, m - 1, d, hour, minute, second);
    };

    let nearestEnd: Date | null = null;
    for (const range of allowedRanges) {
      const end = makeDateFromYMDAndTime(todayStr, range.end);
      if (end > now && (!nearestEnd || end < nearestEnd)) nearestEnd = end;
    }

    if (!nearestEnd) {
      Alert.alert('Không hợp lệ', 'Không có khung giờ đỗ xe hợp lệ hôm nay.');
      return;
    }

    try {
      // 1. Đăng ký nhận thông báo cho route này
      await subscribeToRoute(route.no_parking_route_id);

      // 2. Lên lịch thông báo cảnh báo trước 15 phút
      const warning15 = new Date(nearestEnd.getTime() - 15 * 60 * 1000);
      const notifId15 = await notifee.createTriggerNotification(
        {
          title: 'Sắp hết giờ đỗ xe',
          body: `Còn 15 phút nữa là hết giờ đỗ xe tại ${route.street}`,
          android: {
            channelId: 'parking-notifications',
            importance: AndroidImportance.HIGH,
          },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: warning15.getTime(),
        },
      );

      // 3. Lên lịch thông báo cảnh báo trước 5 phút
      const warning5 = new Date(nearestEnd.getTime() - 5 * 60 * 1000);
      const notifId5 = await notifee.createTriggerNotification(
        {
          title: 'Sắp hết giờ đỗ xe',
          body: `Còn 5 phút nữa là hết giờ đỗ xe tại ${route.street}`,
          android: {
            channelId: 'parking-notifications',
            importance: AndroidImportance.HIGH,
          },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: warning5.getTime(),
        },
      );

      // // 4. Lưu thông tin xác nhận với các ID thông báo
      await confirmRoute({
        routeId: route.no_parking_route_id,
        street: route.street,
        confirmedLat: location?.latitude ?? 0,
        confirmedLon: location?.longitude ?? 0,
        endTime: nearestEnd,
        scheduledNotificationIds: [notifId15, notifId5],
      });

      Alert.alert(
        'Đã xác nhận đỗ xe',
        `Bạn sẽ nhận được thông báo khi sắp hết thời gian được phép đỗ tại ${route.street}.`,
      );
      onClose();
    } catch (error) {
      console.error('Failed to setup notifications:', error);
      Alert.alert('Lỗi', 'Không thể thiết lập thông báo. Vui lòng thử lại.');
    }
  };

  return (
    <Modal
      transparent
      visible={!!route}
      animationType="fade"
      onRequestClose={onClose}
    >
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
          <Text className="font-semibold text-xl text-center mb-1">
            Xác Nhận Đỗ Xe
          </Text>
          <Text className="font-regular text-base text-center mb-3">
            Hãy xác nhận đỗ xe để nhận thông báo cảnh báo tự động
          </Text>

          {route && (
            <View className="items-center">
              <Text className="font-regular text-lg mb-2">
                Tuyến đường {route.street}
              </Text>
              <View className="flex-row items-center gap-2 mb-3">
                <IconClock size={24} color={Colors.blue_button} />
                <View>
                  {getAllowedTimeRanges(route.time_range).map((r, i) => (
                    <Text key={i}>
                      {r.start.slice(0, 5)} - {r.end.slice(0, 5)}
                    </Text>
                  ))}
                </View>
              </View>

              <View className="flex-row w-full gap-2 mt-2">
                <Pressable
                  onPress={onClose}
                  className="bg-gray-300 flex-1 h-[40px] rounded-xl justify-center items-center active:bg-gray-200"
                >
                  <Text className="text-black font-semibold">Đóng</Text>
                </Pressable>

                <Pressable
                  disabled={disableConfirm}
                  onPress={handleConfirm}
                  className={`flex-1 h-[40px] rounded-xl justify-center items-center ${
                    disableConfirm
                      ? 'bg-gray-400 active:bg-gray-200'
                      : 'bg-blue-600 active:bg-blue-400'
                  }`}
                >
                  <Text className="text-white font-semibold">
                    {confirmed?.routeId === route.no_parking_route_id
                      ? "Đã xác nhận"
                      : "Xác Nhận Đỗ"}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

export default ConfirmParkingRoutesModal;
