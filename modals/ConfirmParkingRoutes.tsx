import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import { IconClock } from "@/components/Icons";
import Colors from "@/constants/colors";
import { isUserOnRoute, useConfirmedParking } from "@/hooks/useConfirmParking";
import { useLocation } from "@/hooks/useLocation";
import { getAllowedTimeRanges } from "@/utils/time";
import { sendParkingNotification } from "@/service/fcmService"; // service backend gửi FCM

interface Props {
  onClose: () => void;
  route: NoParkingRoute | null;
}


const ConfirmParkingModal: React.FC<Props> = ({ route, onClose }) => {
  const { location } = useLocation();
  const { confirmed, confirmRoute } = useConfirmedParking();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [selectedConfirm, setselectedConfirm] = useState<number | null>(null);

  // --- Kiểm tra xem user có nằm trong tuyến không ---
  let canConfirmOnRoute = false;
  if (route && location && route.location_begin && route.location_end) {
    canConfirmOnRoute = isUserOnRoute(
      location.latitude,
      location.longitude,
      [route.location_begin[1], route.location_begin[0]],
      [route.location_end[1], route.location_end[0]],
      50 // bán kính kiểm tra 50m
    );
  }

  
  const isAlreadyConfirmedOther =
    confirmed && confirmed.routeId !== route?.no_parking_route_id;

  const disableConfirm = isAlreadyConfirmedOther || !canConfirmOnRoute;

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
    if (!route || disableConfirm) {
      Alert.alert("Không thể xác nhận", "Bạn cần ở gần tuyến đường hơn để xác nhận.");
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

    if (!nearestEnd) {
      Alert.alert("Không hợp lệ", "Không có khung giờ đỗ xe hợp lệ hôm nay.");
      return;
    }

    const warning15 = new Date(nearestEnd.getTime() - 15 * 60 * 1000);
    const warning5 = new Date(nearestEnd.getTime() - 5 * 60 * 1000);

    // --- Gửi thông báo qua Backend -> Firebase FCM ---
    await sendParkingNotification({
      street: route.street,
      routeId: route.no_parking_route_id,
      warning15,
      warning5,
    });



    // Lưu thông tin xác nhận
    await confirmRoute({
      routeId: route.no_parking_route_id,
      street: route.street,
      confirmedLat: location?.latitude ?? 0,
      confirmedLon: location?.longitude ?? 0,
      endTime: nearestEnd,
    });

    Alert.alert(
      "Đã xác nhận đỗ xe",
      `Bạn sẽ nhận được thông báo khi sắp hết thời gian được phép đỗ tại ${route.street}.`
    );
    onClose();
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
                  className="bg-gray-200 flex-1 h-[40px] rounded-xl justify-center items-center"
                >
                  <Text className="text-black font-semibold">Đóng</Text>
                </Pressable>

                <Pressable
                  disabled={disableConfirm}
                  onPress={handleConfirm}
                  className={`flex-1 h-[40px] rounded-xl justify-center items-center ${
                    disableConfirm ? "bg-gray-400" : "bg-blue-500"
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

export default ConfirmParkingModal;
