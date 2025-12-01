
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
