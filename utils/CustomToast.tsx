// import React from "react";
// import { View, Text } from "react-native";
// import { Toast } from "toastify-react-native";
// import { ToastShowParams } from "toastify-react-native/utils/interfaces";
// import { FontAwesome } from "@react-native-vector-icons/fontawesome"; // hoặc "react-native-vector-icons/FontAwesome"

// // ======================== CẤU HÌNH TOAST ========================
// const COLORS = {
//   success: "#4CAF50",
//   error: "#F44336",
//   warning: "#FF9800",
//   info: "#2196F3",
// } as const;

// type ToastType = keyof typeof COLORS;

// const show = (
//   type: ToastType,
//   title: string,
//   message?: string,
//   duration: number = 2000
// ) => {
//   Toast.show({
//     type: type as ToastShowParams["type"], // ✅ ép kiểu an toàn
//     text1: title,
//     text2: message,
//     position: "bottom",
//     visibilityTime: duration,
//     autoHide: true,
//     iconFamily: 'FontAwesome',
//     icon: type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : type === 'warning' ? 'exclamation-circle' : 'info-circle',
//     closeIconFamily: 'FontAwesome',
//     closeIcon: 'times',
//     closeIconColor: 'black',
//     closeIconSize: 20,
//     useModal: true,
//     topOffset: 30,
//     bottomOffset: 40,
//     onShow: () => {},
//     onHide: () => {},
//     onPress: () => {},
    
    
//   });
// };

// const ToastCustom = {
//   success: (title: string, message?: string, duration?: number) =>
//     show("success", title, message, duration),
//   error: (title: string, message?: string, duration?: number) =>
//     show("error", title, message, duration),
//   warning: (title: string, message?: string, duration?: number) =>
//     show("warning", title, message, duration),
//   info: (title: string, message?: string, duration?: number) =>
//     show("info", title, message, duration),
// };

// export default ToastCustom;


// // ToastCustom.tsx
import { Toast } from "toastify-react-native";
import { ToastShowParams } from "toastify-react-native/utils/interfaces";

type ToastType = "success" | "error" | "warning" | "info";

const baseOptions = {
  position: "bottom" as const,
  autoHide: true,
  // điều chỉnh offset nếu cần để không chạm vào safe area
  bottomOffset: 40,
};

const show = (type: ToastType, title: string, message?: string, duration = 2000) => {
  Toast.show({
    type: type as ToastShowParams["type"],
    text1: title,
    text2: message,
    visibilityTime: duration,
    ...baseOptions,
  });
};

const ToastCustom = {
  success: (title: string, message?: string, duration?: number) => show("success", title, message, duration),
  error: (title: string, message?: string, duration?: number) => show("error", title, message, duration),
  warning: (title: string, message?: string, duration?: number) => show("warning", title, message, duration),
  info: (title: string, message?: string, duration?: number) => show("info", title, message, duration),
};

export default ToastCustom;
