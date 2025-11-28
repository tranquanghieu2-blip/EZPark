import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, Text, View, ActivityIndicator } from 'react-native';
import { IconClock } from '@/components/Icons';
import Colors from '@/constants/colors';
import { useConfirmedParking } from '@/hooks/useConfirmParking';
import { getAllowedTimeRanges } from '@/utils/time';
import { useSmartMapboxLocation } from '@/hooks/usePeriodicMapboxLocation';
import ToastCustom from '@/utils/CustomToast';
import haversine from 'haversine-distance';

interface Props {
  onClose: () => void;
  route: NoParkingRoute | null;
}

function distanceToSegment(
  p: { latitude: number; longitude: number },
  a: [number, number],
  b: [number, number],
) {
  const [lon1, lat1] = a;
  const [lon2, lat2] = b;

  // Vector A -> B (in lon/lat)
  const ABx = lon2 - lon1;
  const ABy = lat2 - lat1;

  // Vector A -> P
  const APx = p.longitude - lon1;
  const APy = p.latitude - lat1;

  const dot = ABx * APx + ABy * APy;
  const lenSq = ABx * ABx + ABy * ABy;
  const t = Math.max(0, Math.min(1, dot / (lenSq || 1))); // avoid div by zero

  // Projection point on segment
  const projLon = lon1 + ABx * t;
  const projLat = lat1 + ABy * t;

  // Return haversine distance (meters) between user and projection
  return haversine(
    { lat: p.latitude, lon: p.longitude },
    { lat: projLat, lon: projLon },
  );
}

function distanceToPolyline(
  point: { latitude: number; longitude: number },
  coords: [number, number][],
) {
  if (!coords || coords.length < 2) return Infinity;
  let min = Infinity;
  for (let i = 0; i < coords.length - 1; i++) {
    const d = distanceToSegment(point, coords[i], coords[i + 1]);
    if (d < min) min = d;
  }
  return min;
}

function isUserOnRoute(
  userLat: number,
  userLon: number,
  coords: [number, number][],
  toleranceMeters: number,
): boolean {
  if (!coords || coords.length < 2) return false;
  const dist = distanceToPolyline({ latitude: userLat, longitude: userLon }, coords);
  return dist <= toleranceMeters;
}

const ConfirmParkingRoutesModal: React.FC<Props> = ({ route, onClose }) => {
  const location = useSmartMapboxLocation();
  const { confirmed, confirmRoute, clearConfirmed } = useConfirmedParking();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [processingAction, setProcessingAction] = useState<'confirm' | 'cancel' | null>(null);

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

  // Hàm xác nhận đỗ xe (có loading)
  const handleConfirm = async () => {
    if (!route || !canConfirmOnRoute) {
      ToastCustom.warning('Quá xa', 'Bạn đang ở quá xa tuyến đường.');
      return;
    }
    setProcessingAction('confirm');
    try {
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
      // Đợi ngắn để cập nhật state rồi đóng modal
      setTimeout(onClose, 50);
    } catch (err) {
      console.error('handleConfirm error:', err);
      ToastCustom.error('Lỗi', 'Không thể xác nhận đỗ hiện tại.');
    } finally {
      setProcessingAction(null);
    }
  };

  // Hàm hủy xác nhận đỗ
  const handleCancelConfirm = async () => {
    setProcessingAction('cancel');
    try {
      await clearConfirmed();
      ToastCustom.success('Đã hủy thông báo', 'Bạn sẽ không nhận thông báo nữa.');
      setTimeout(onClose, 50);
    } catch (err) {
      console.error('handleCancelConfirm error:', err);
      ToastCustom.error('Lỗi', 'Không thể hủy thông báo.');
    } finally {
      setProcessingAction(null);
    }
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
                  disabled={processingAction !== null}
                  className="bg-gray-300 flex-1 h-[40px] rounded-xl justify-center items-center"
                  style={{ opacity: processingAction ? 0.6 : 1 }}
                >
                  <Text className="text-black font-semibold">Đóng</Text>
                </Pressable>

                <Pressable
                  onPress={isConfirmed ? handleCancelConfirm : handleConfirm}
                  disabled={processingAction !== null}
                  className={`flex-1 h-[40px] rounded-xl justify-center items-center ${
                    isConfirmed
                      ? 'bg-red-600 active:bg-red-400'
                      : 'bg-blue-600 active:bg-blue-400'
                  }`}
                  style={{ opacity: processingAction ? 0.8 : 1 }}
                >
                  {processingAction === 'confirm' && !isConfirmed ? (
                    <ActivityIndicator color="white" />
                  ) : processingAction === 'cancel' && isConfirmed ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-semibold">
                      {isConfirmed ? 'Hủy Thông Báo' : 'Xác Nhận Đỗ'}
                    </Text>
                  )}
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
