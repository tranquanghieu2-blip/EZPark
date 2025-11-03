import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, Text, View } from 'react-native';
import { IconClock } from '@/components/Icons';
import Colors from '@/constants/colors';
import { useConfirmedParking } from '@/hooks/useConfirmParking';
import { getAllowedTimeRanges } from '@/utils/time';
import { useSmartMapboxLocation } from '@/hooks/usePeriodicMapboxLocation';
import ToastCustom from '@/utils/CustomToast';

interface Props {
  onClose: () => void;
  route: NoParkingRoute | null;
}
/** Khoảng cách điểm → đoạn tuyến (m) */
function getDistanceMeters(
  lat: number,
  lon: number,
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const toRad = (deg: number): number => (deg * Math.PI) / 180;

  const x = R * toRad(lon) * Math.cos(toRad(lat));
  const y = R * toRad(lat);
  const x1 = R * toRad(lon1) * Math.cos(toRad(lat1));
  const y1 = R * toRad(lat1);
  const x2 = R * toRad(lon2) * Math.cos(toRad(lat2));
  const y2 = R * toRad(lat2);

  const A = { x: x1, y: y1 };
  const B = { x: x2, y: y2 };
  const P = { x, y };

  const AB = { x: B.x - A.x, y: B.y - A.y };
  const AP = { x: P.x - A.x, y: P.y - A.y };
  const ab2 = AB.x * AB.x + AB.y * AB.y;
  const t = Math.max(0, Math.min(1, (AP.x * AB.x + AP.y * AB.y) / ab2));

  const closest = { x: A.x + AB.x * t, y: A.y + AB.y * t };
  const dx = P.x - closest.x;
  const dy = P.y - closest.y;

  return Math.sqrt(dx * dx + dy * dy);
}

/** Kiểm tra user có nằm gần tuyến đường (polyline) không */
function isUserOnRoute(
  userLat: number,
  userLon: number,
  route: [number, number][],
  toleranceMeters: number,
): boolean {
  if (!route || route.length < 2) return false;

  let minDistance = Infinity;
  for (let i = 0; i < route.length - 1; i++) {
    const [lon1, lat1] = route[i];
    const [lon2, lat2] = route[i + 1];
    const d = getDistanceMeters(userLat, userLon, lat1, lon1, lat2, lon2);
    minDistance = Math.min(minDistance, d);
  }
  return minDistance <= toleranceMeters;
}

const ConfirmParkingRoutesModal: React.FC<Props> = ({ route, onClose }) => {
  const location = useSmartMapboxLocation();
  const { confirmed, confirmRoute, clearConfirmed } = useConfirmedParking();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const canConfirmOnRoute =
    route &&
    location &&
    isUserOnRoute(
      location.latitude,
      location.longitude,
      route.route?.coordinates || [],
      50,
    );

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: route ? 1 : 0,
      duration: route ? 400 : 200,
      useNativeDriver: true,
    }).start();
  }, [route]);

  // Hàm xác nhận đỗ xe
  const handleConfirm = async () => {
    if (!route || !canConfirmOnRoute) {
      ToastCustom.warning('Quá xa', 'Bạn đang ở quá xa tuyến đường.');
      return;
    }

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

    await confirmRoute({
      routeId: route.no_parking_route_id,
      street: route.street,
      confirmedLat: location?.latitude ?? 0,
      confirmedLon: location?.longitude ?? 0,
      endTime: nearestEnd,
      route: route.route?.coordinates || [],
    });

    ToastCustom.success('Xác nhận đỗ thành công!', `Tuyến: ${route.street}`);
    // Đợi 500ms để đảm bảo trạng thái được cập nhật và lưu
    setTimeout(onClose, 50);
  };

  // Hàm hủy xác nhận đỗ
  const handleCancelConfirm = async () => {
    await clearConfirmed();
    ToastCustom.success('Đã hủy thông báo', 'Bạn sẽ không nhận thông báo nữa.');
    // Đợi 500ms
    setTimeout(onClose, 50);
  };

  // const isConfirmed = confirmed?.routeId === route?.no_parking_route_id;
  const isConfirmed =
    confirmed?.routeId !== undefined &&
    route?.no_parking_route_id !== undefined &&
    String(confirmed.routeId) === String(route.no_parking_route_id);

  // Khi hết hạn và confirmed bị clear, UI sẽ cập nhật lại
  useEffect(() => {
    if (isConfirmed === false && route) {
      console.log('UI cập nhật: đã hết hạn, hiển thị lại nút xác nhận');
    }
  }, [isConfirmed]);

  return (
    <Modal
      transparent
      visible={!!route}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/30">
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
            Hãy xác nhận đỗ xe để nhận thông báo tự động
          </Text>

          {route && (
            <View className="items-center">
              <Text className="font-regular text-lg mb-2">
                Tuyến {route.street}
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
                  className="bg-gray-300 flex-1 h-[40px] rounded-xl justify-center items-center"
                >
                  <Text className="text-black font-semibold">Đóng</Text>
                </Pressable>

                <Pressable
                  onPress={isConfirmed ? handleCancelConfirm : handleConfirm}
                  className={`flex-1 h-[40px] rounded-xl justify-center items-center ${
                    isConfirmed
                      ? 'bg-red-600 active:bg-red-400'
                      : 'bg-blue-600 active:bg-blue-400'
                  }`}
                >
                  <Text className="text-white font-semibold">
                    {isConfirmed ? 'Hủy Thông Báo' : 'Xác Nhận Đỗ'}
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
