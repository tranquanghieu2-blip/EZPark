import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, Text, View, ActivityIndicator } from 'react-native';
import { IconClock } from '@/components/Icons';
import Colors from '@/constants/colors';
import { useConfirmedParkingContext } from '@/app/context/ConfirmedParkingContext';
import { getAllowedTimeRanges } from '@/utils/time';
import { useSmartMapboxLocation } from '@/hooks/usePeriodicMapboxLocation';
import ToastCustom from '@/utils/CustomToast';
import haversine from 'haversine-distance';

interface Props {
  onClose: () => void;
  route: NoParkingRoute | null;
  showRouteParking: boolean;
  onSetShowRouteParking: (show: boolean) => void;
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

const ConfirmParkingRoutesModal: React.FC<Props> = ({ route, onClose, showRouteParking, onSetShowRouteParking }) => {
  const location = useSmartMapboxLocation();
  const { confirmed, confirmRoute, clearConfirmed } = useConfirmedParkingContext();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [processingAction, setProcessingAction] = useState<'confirm' | 'cancel' | null>(null);




  // Hàm lấy loại chẵn lẻ
  const getAlternateDaysNote = (route: NoParkingRoute): string => {
    if (route.type !== "alternate days") return "";

    const today = new Date();
    const dayOfMonth = today.getDate();
    const isEvenDay = dayOfMonth % 2 === 0;

    // Nếu ngày chẵn cấm bên chẵn chỉ đỗ bên lẻ; ngày lẻ ngược lại
    const allowedSide = isEvenDay ? "Bên lẻ" : "Bên chẵn";
    return allowedSide;
  };

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

      onSetShowRouteParking(true);
      showRouteParking = true;

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
      onSetShowRouteParking(false);
      showRouteParking = false;
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


  // tự động đóng modal và reset showRouteParking nếu user không mở modal
  useEffect(() => {
    if (!route && !isConfirmed && showRouteParking) {
      // Tự động ẩn banner/showRouteParking
      onSetShowRouteParking(false);
    }
  }, [confirmed, route, showRouteParking, onSetShowRouteParking]);

  return (
    <>
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
          {route?.type === "alternate days"
          ? 'Thông tin Tuyến Chẵn Lẻ'
          : isConfirmed ? 'Đã Xác Nhận Đỗ Xe' : 'Xác Nhận Đỗ Xe'}

            
          </Text>
          <Text className="font-medium text-lg text-center mb-3">
            {route?.type === "alternate days" 
              ? 'Lưu ý: Hôm nay chỉ được đỗ bên ' + getAlternateDaysNote(route)
              : isConfirmed
                ? 'Hủy thông báo đỗ xe trên tuyến này nếu bạn đã rời đi.'
                : 'Vui lòng xác nhận bạn đang đỗ xe trên tuyến này.'}
          </Text>

          {route && (
            <View className="items-center">
              <Text className="font-semibold text-xl text-center">{route.street}</Text>
              <View className="flex-row items-center gap-2 mb-3">
                <IconClock size={24} color={Colors.blue_button} />
                <View>
                  {route.type === "alternate days" ? (
                    route.time_range && route.time_range.length > 0 ? (
                      route.time_range.map((r, i) => (
                        <Text key={i}>
                          {r.start.slice(0, 5)} - {r.end.slice(0, 5)}
                        </Text>
                      ))
                    ) : (
                      <Text className="text-lg text-gray-700">Không giới hạn</Text>
                    )
                  ) : (
                    getAllowedTimeRanges(route.time_range).map((r, i) => (
                      <Text key={i}>
                        {r.start.slice(0, 5)} - {r.end.slice(0, 5)}
                      </Text>
                    ))
                  )}
                </View>
              </View>


              <View className="flex-row w-full gap-2 mt-2">
                {route?.type === "alternate days" ? (
                  // Chỉ hiển thị nút Đóng cho tuyến chẵn lẻ
                  <Pressable
                    onPress={onClose}
                    disabled={processingAction !== null}
                    className="bg-gray-300 flex-1 h-[40px] rounded-xl justify-center items-center"
                    style={{ opacity: processingAction ? 0.6 : 1 }}
                  >
                    <Text className="text-black font-semibold">Đóng</Text>
                  </Pressable>
                ) : (
                  // Hiển thị cả 2 nút cho tuyến khác
                  <>
                    <Pressable
                      onPress={onClose}
                      disabled={processingAction !== null}
                      className="bg-gray-300 flex-1 h-[40px] rounded-xl justify-center items-center"
                      style={{ opacity: processingAction ? 0.6 : 1 }}
                    >
                      <Text className="text-black font-semibold">Đóng</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        if (isConfirmed) {
                          handleCancelConfirm();
                        } else {
                          handleConfirm();
                        }
                      }}
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
                  </>
                )}
              </View>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
    </>
  );
};

export default ConfirmParkingRoutesModal;
