import React, { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, Text, View } from "react-native";
import { IconClock } from "@/components/Icons";
import Colors from "@/constants/colors";
import { useConfirmedParking } from "@/hooks/useConfirmParking";
import { isUserOnRoute } from "@/hooks/Helper/UseConfirmParkringHelper";
import { getAllowedTimeRanges } from "@/utils/time";
import { useSmartMapboxLocation } from "@/hooks/usePeriodicMapboxLocation";
import ToastCustom from "@/utils/CustomToast";

interface Props {
  onClose: () => void;
  route: NoParkingRoute | null;
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
      10
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
      ToastCustom.warning("Quá xa", "Bạn đang ở quá xa tuyến đường.");
      return;
    }

    const allowedRanges = getAllowedTimeRanges(route.time_range);
    const now = new Date();
    const todayStr = now.toLocaleDateString("en-CA");

    const makeDateFromYMDAndTime = (ymd: string, timeStr: string) => {
      const [y, m, d] = ymd.split("-").map(Number);
      const [hour, minute, second] = timeStr.split(":").map(Number);
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

    ToastCustom.success("Xác nhận đỗ thành công!", `Tuyến: ${route.street}`);
    // Đợi 500ms để đảm bảo trạng thái được cập nhật và lưu
    setTimeout(onClose, 0);
  };

  // Hàm hủy xác nhận đỗ
  const handleCancelConfirm = async () => {
    await clearConfirmed();
    ToastCustom.success("Đã hủy thông báo", "Bạn sẽ không nhận thông báo nữa.");
    // Đợi 500ms
    setTimeout(onClose, 0);
  };

  // const isConfirmed = confirmed?.routeId === route?.no_parking_route_id;
  const isConfirmed = confirmed?.routeId !== undefined && 
                   route?.no_parking_route_id !== undefined && 
                   String(confirmed.routeId) === String(route.no_parking_route_id);

  return (
    <Modal transparent visible={!!route} animationType="fade" onRequestClose={onClose}>
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
          <Text className="font-semibold text-xl text-center mb-1">Xác Nhận Đỗ Xe</Text>
          <Text className="font-regular text-base text-center mb-3">
            Hãy xác nhận đỗ xe để nhận thông báo tự động
          </Text>

          {route && (
            <View className="items-center">
              <Text className="font-regular text-lg mb-2">Tuyến {route.street}</Text>
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
                      ? "bg-red-600 active:bg-red-400"
                      : "bg-blue-600 active:bg-blue-400"
                  }`}
                >
                  <Text className="text-white font-semibold">
                    {isConfirmed ? "Hủy Thông Báo" : "Xác Nhận Đỗ"}
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
