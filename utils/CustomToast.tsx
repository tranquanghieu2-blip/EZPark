import React from "react";
import { View, Text } from "react-native";
import { Toast } from "toastify-react-native";
import { ToastShowParams } from "toastify-react-native/utils/interfaces";
import { FontAwesome } from "@react-native-vector-icons/fontawesome"; // hoặc "react-native-vector-icons/FontAwesome"

// ======================== CẤU HÌNH TOAST ========================
const COLORS = {
  success: "#4CAF50",
  error: "#F44336",
  warning: "#FF9800",
  info: "#2196F3",
} as const;

type ToastType = keyof typeof COLORS;

// ======================== COMPONENT HIỂN THỊ TOAST ========================
interface BaseToastProps {
  type: ToastType;
  text1: string;
  text2?: string;
}

const BaseToast: React.FC<BaseToastProps> = ({ type, text1, text2 }) => {
  const iconMap: Record<ToastType, string> = {
    success: "check-circle",
    error: "times-circle",
    warning: "exclamation-circle",
    info: "info-circle",
  };

  return (
    <View
      style={{
        backgroundColor: COLORS[type],
        flexDirection: "row",
        alignItems: "center",
        padding: 14,
        borderRadius: 12,
        marginHorizontal: 12,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ color: "white", fontWeight: "bold", fontSize: 15 }}>
          {text1}
        </Text>
        {text2 ? (
          <Text style={{ color: "white", marginTop: 2 }}>{text2}</Text>
        ) : null}
      </View>
    </View>
  );
};

// ======================== TOAST CONFIG ========================
export const toastConfig = {
  success: (props: any) => <BaseToast {...props} type="success" />,
  error: (props: any) => <BaseToast {...props} type="error" />,
  warning: (props: any) => <BaseToast {...props} type="warning" />,
  info: (props: any) => <BaseToast {...props} type="info" />,
};

// ======================== HÀM GỌI NHANH ========================
const show = (
  type: ToastType,
  title: string,
  message?: string,
  duration: number = 2000
) => {
  Toast.show({
    type: type as ToastShowParams["type"], // ✅ ép kiểu an toàn
    text1: title,
    text2: message,
    position: "bottom",
    visibilityTime: duration,
    autoHide: true,
    iconFamily: 'FontAwesome',
    icon: type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : type === 'warning' ? 'exclamation-circle' : 'info-circle',
    closeIconFamily: 'FontAwesome',
    closeIcon: 'times',
    closeIconColor: 'black',
    closeIconSize: 20,
    useModal: true,
    topOffset: 30,
    bottomOffset: 40,
    onShow: () => {},
    onHide: () => {},
    onPress: () => {},
    
    
  });
};

const ToastCustom = {
  success: (title: string, message?: string, duration?: number) =>
    show("success", title, message, duration),
  error: (title: string, message?: string, duration?: number) =>
    show("error", title, message, duration),
  warning: (title: string, message?: string, duration?: number) =>
    show("warning", title, message, duration),
  info: (title: string, message?: string, duration?: number) =>
    show("info", title, message, duration),
};

export default ToastCustom;
