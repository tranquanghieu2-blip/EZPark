// import { IconClock } from "@/components/Icons";
// import Colors from "@/constants/colors";
// import { isUserOnRoute, useConfirmedParking } from "@/hooks/useConfirmParking";
// import { useLocation } from "@/hooks/useLocation";
// import { scheduleNotificationAtDate } from "@/service/notifications";
// import { getAllowedTimeRanges } from "@/utils/time";
// import React, { useEffect, useRef, useState } from "react";
// import { Alert, Animated, Modal, Pressable, Text, View } from "react-native";

// interface Props {
//   onClose: () => void;
//   route: NoParkingRoute | null;
// }

// const ConfirmParkingModal: React.FC<Props> = ({ route, onClose }) => {
//   const { location } = useLocation();
//   const { confirmed, confirmRoute } = useConfirmedParking();
//   const fadeAnim = useRef(new Animated.Value(0)).current;
//   const [selectedConfirm, setselectedConfirm] = useState<number | null>(null);

//   // kiểm tra user có trên tuyến không
//   let canConfirmOnRoute = false;
//   if (route && location && route.location_begin && route.location_end) {
//     canConfirmOnRoute = isUserOnRoute(
//   location.latitude,
//   location.longitude,
//   [route.location_begin[1], route.location_begin[0]], // đổi lại thành [lat, lon]
//   [route.location_end[1], route.location_end[0]],
//   50
// );

//     console.log("User loc:", location);
//     console.log("Begin:", route.location_begin, "End:", route.location_end);
//     console.log(
//       "canConfirmOnRoute?",
//       isUserOnRoute(
//         location.latitude,
//         location.longitude,
//         route.location_begin,
//         route.location_end,
//         50
//       )
//     );
//   }

//   const isAlreadyConfirmedOther =
//     confirmed && confirmed.routeId !== route?.no_parking_route_id;

//   const disableConfirm = isAlreadyConfirmedOther || !canConfirmOnRoute;

//   console.log("confirmed:", confirmed);
//   console.log("isAlreadyConfirmedOther:", isAlreadyConfirmedOther);
//   console.log("disableConfirm:", disableConfirm);

//   useEffect(() => {
//     if (route) {
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 500,
//         useNativeDriver: true,
//       }).start();
//     } else {
//       Animated.timing(fadeAnim, {
//         toValue: 0,
//         duration: 200,
//         useNativeDriver: true,
//       }).start();
//     }
//   }, [route]);

//   return (
//     <Modal
//       transparent
//       visible={!!route}
//       animationType="slide"
//       onRequestClose={onClose}
//     >
//       <View className="flex-1 justify-center items-center bg-black/30 w-full h-full">
//         <View className="bg-white rounded-2xl p-6 w-4/5">
//           <Text className="font-semibold text-xl text-center">
//             Xác Nhận Đỗ Xe
//           </Text>

//           <Text className="font-regular text-xl text-center">
//             Hãy xác nhận đỗ xe để được nhận thông báo
//           </Text>

//           {route ? (
//             <View className="w-full">
//               <View className="flex items-center justify-center gap-3">
//                 <View className="flex items-center">
//                   <Text className="font-regular text-xl text-center">
//                     Tuyến đường {route.street}
//                   </Text>
//                 </View>
//               </View>

//               <View className="mt-3 gap-2 w-full flex mr-10">
//                 <View className="flex-row items-center gap-3 self-center mr-7">
//                   <IconClock size={24} color={Colors.blue_button} />
//                   <View>
//                     {getAllowedTimeRanges(route.time_range).map((r, idx) => (
//                       <Text key={idx}>
//                         {r.start.slice(0, 5)} - {r.end.slice(0, 5)}
//                       </Text>
//                     ))}
//                   </View>
//                 </View>
//               </View>

//               <View className="flex-row justify-center w-full gap-2">
//                 <Pressable
//                   onPress={onClose}
//                   className="bg-gray-200 flex-1 h-[40px] px-4 py-2 mt-4 rounded-xl self-center justify-center items-center"
//                 >
//                   <Text className="text-black text-center font-semibold">
//                     Đóng
//                   </Text>
//                 </Pressable>

//                 <Pressable
//                   disabled={disableConfirm}
//                   onPress={async () => {
//                     if (!route || disableConfirm){
//                        Alert.alert(
//                       "Quá xa",
//                       `Bạn sẽ nhận được cảnh báo trước 15 phút và 5 phút khi sắp hết thời gian được phép đỗ xe tại ${route.street}.`
//                     );
//                       return;
//                     }

                    
//                     const allowedRanges = getAllowedTimeRanges(
//                       route.time_range
//                     );
//                     const now = new Date();
//                     const todayStr = now.toLocaleDateString("en-CA");

//                     const makeDateFromYMDAndTime = (
//                       ymd: string,
//                       timeStr: string
//                     ) => {
//                       const [y, m, d] = ymd.split("-").map((v) => Number(v));
//                       const parts = timeStr.split(":").map((v) => Number(v));
//                       const hour = parts[0] ?? 0;
//                       const minute = parts[1] ?? 0;
//                       const second = parts[2] ?? 0;
//                       return new Date(y, m - 1, d, hour, minute, second);
//                     };

//                     let nearestEnd: Date | null = null;
//                     for (const range of allowedRanges) {
//                       const end = makeDateFromYMDAndTime(todayStr, range.end);
//                       if (end > now && (!nearestEnd || end < nearestEnd)) {
//                         nearestEnd = end;
//                       }
//                     }

//                     const scheduledIds: string[] = [];
//                     if (nearestEnd) {
//                       const warningTime15 = new Date(
//                         nearestEnd.getTime() - 15 * 60 * 1000
//                       );
//                       const warningTime5 = new Date(
//                         nearestEnd.getTime() - 5 * 60 * 1000
//                       );
//                       if (warningTime15 > now) {
//                         const id = await scheduleNotificationAtDate(
//                           `Cảnh báo 15 phút`,
//                           `Còn 15 phút nữa sẽ cấm đỗ tại ${route.street}. Vui lòng di chuyển!`,
//                           warningTime15
//                         );
//                         if (id) scheduledIds.push(id);
//                       }
//                       if (warningTime5 > now) {
//                         const id = await scheduleNotificationAtDate(
//                           `Cảnh báo 5 phút`,
//                           `Còn 5 phút nữa sẽ cấm đỗ tại ${route.street}. Vui lòng di chuyển ngay!`,
//                           warningTime5
//                         );
//                         if (id) scheduledIds.push(id);
//                       }
//                     }

//                     const lat = location?.latitude ?? 0;
//                     const lon = location?.longitude ?? 0;

//                     await confirmRoute({
//                       routeId: route.no_parking_route_id,
//                       street: route.street,
//                       confirmedLat: lat,
//                       confirmedLon: lon,
//                       endTime: nearestEnd ?? null,
//                       scheduledNotificationIds: scheduledIds,
//                     });

//                     Alert.alert(
//                       "Đã xác nhận đỗ xe",
//                       `Bạn sẽ nhận được cảnh báo trước 15 phút và 5 phút khi sắp hết thời gian được phép đỗ xe tại ${route.street}.`
//                     );
//                     onClose();
//                   }}
//                   className={`flex-1 h-[40px] px-4 py-2 mt-4 rounded-xl self-center justify-center items-center ${
//                     disableConfirm ? "bg-gray-400" : "bg-blue-500"
//                   }`}
//                 >
//                   <Text className="text-white text-center font-semibold">
//                     {confirmed?.routeId === route.no_parking_route_id
//                       ? "Đã xác nhận"
//                       : "Xác Nhận Đỗ"}
//                   </Text>
//                 </Pressable>
//               </View>
//             </View>
//           ) : null}
//         </View>
//       </View>
//     </Modal>
//   );
// };

// export default ConfirmParkingModal;
