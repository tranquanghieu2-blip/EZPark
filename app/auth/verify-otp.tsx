import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Modal,
} from "react-native";
import GradientButton from "@/components/GradientButton";
import { images } from "@/constants/images";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import usePost from "@/hooks/usePost";
import { sendPasswordResetOtp, signUp, verifyOtp, verifyPasswordResetOtp } from "@/service/api";
import ToastCustom from "@/utils/CustomToast";

// định nghĩa kiểu param
type RootStackParamList = {
  "verify-otp": { email: string; password?: string, name?: string, flowType: "signup" | "forgot-password" };
  login: undefined;
  "reset-password": { email: string, code: string };
};

type VerifyOtpRouteProp = RouteProp<RootStackParamList, "verify-otp">;

export default function VerifyOTP() {
  const route = useRoute<VerifyOtpRouteProp>();
  const navigation = useNavigation<any>();
  const { email, password, name, flowType } = route.params;

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  // const [timer, setTimer] = useState(60);
  const [timer, setTimer] = useState(180);
  const [showFailModal, setShowFailModal] = useState(false);
  const [isButtonEnabled, setIsButtonEnabled] = useState(false); // kiểm soát enable/disable nút

  const inputs = useRef<TextInput[]>([]);
  // const { loading: loadingVerifySignup, execute: executeVerifySignup } = usePost(verifyOtp);
  // const { loading: loadingSignUp, execute: executeSignUp, error: errorSignUp } = usePost(signUp);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingResend, setLoadingResend] = useState(false);


  // Log email nhận được
  useEffect(() => {
    console.log("Email nhận từ SignUp:", email);
  }, [email]);

  // Bộ đếm ngược
  useEffect(() => {
    if (timer <= 0) return;
    const countdown = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) clearInterval(countdown);
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(countdown);
  }, [timer]);

  // Reset OTP nếu hết thời gian
  useEffect(() => {
    if (timer === 0) {
      setOtp(["", "", "", "", "", ""]);
    }
  }, [timer]);

  // format mm:ss
  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const remainingSeconds = secs % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  };


  // Cập nhật trạng thái enable/disable của nút xác thực
  useEffect(() => {
    const isOtpFilled = otp.join("").length === 6;
    const isTimerRunning = timer > 0;
    setIsButtonEnabled(isOtpFilled && isTimerRunning);
  }, [otp, timer]);

  // Xử lý thay đổi input
  const handleChange = (text: string, index: number) => {
    if (/^\d?$/.test(text)) {
      const newOtp = [...otp];
      newOtp[index] = text;
      setOtp(newOtp);

      // Nếu nhập số, nhảy sang ô tiếp theo
      if (text && index < otp.length - 1) {
        inputs.current[index + 1]?.focus();
      }

      // Nếu xoá thì lùi lại ô trước
      if (!text && index > 0) {
        inputs.current[index - 1]?.focus();
      }
    }
  };

  // Hàm xử lý xác thực OTP
  const handleVerify = async () => {
    if (!isButtonEnabled || loadingVerify) return;

    setLoadingVerify(true);
    const code = otp.join("");

    try {
      let res;
      if (flowType === "forgot-password") {
        res = await verifyPasswordResetOtp(email, code);
        if (!res?.success) throw new Error(res?.message);

        ToastCustom.success("Xác thực thành công", "Vui lòng đặt lại mật khẩu mới.");
        navigation.navigate("reset-password", {
          email: res?.email,
          resetToken: res?.resetToken,
        });
      } else {
        res = await verifyOtp(email, code);
        if (!res?.success) throw new Error(res?.message);

        ToastCustom.success("Xác thực thành công", "Bạn có thể đăng nhập ngay bây giờ.");
        navigation.navigate("login");
      }
    } catch (err: any) {
      console.error("Lỗi xác thực OTP:", err);
      ToastCustom.error("Xác thực thất bại", err?.message || "OTP không hợp lệ hoặc đã hết hạn.");
    } finally {
      setLoadingVerify(false);
    }
  };

  // Gửi lại OTP
  const handleResendOtp = async () => {
    if (timer > 0 || loadingResend) return;
    setLoadingResend(true);
    setOtp(["", "", "", "", "", ""]);

    try {
      let res;
      if (flowType === "signup") {
        res = await signUp(email, password!, name!);
      } else {
        res = await sendPasswordResetOtp(email);
      }

      if (!res?.success) throw new Error(res?.message);
      ToastCustom.success("OTP đã được gửi lại", "Vui lòng kiểm tra email của bạn.");
      setTimer(180);
    } catch (err: any) {
      console.error("Lỗi gửi lại OTP:", err);
      ToastCustom.error("Gửi lại thất bại", err?.message || "Không thể gửi OTP, thử lại sau.");
    } finally {
      setLoadingResend(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-white justify-center p-6"
    >
      <View className="items-center mb-12">
        <Image
          source={images.mail}
          style={{ width: 150, height: 150 }}
          resizeMode="contain"
        />
      </View>

      <Text className="text-2xl font-bold text-center mb-2">Xác thực OTP</Text>
      <Text className="text-gray-500 text-center mb-8">
        Nhập OTP được gửi về email của bạn
      </Text>

      {/* Ô nhập OTP */}
      <View className="flex-row justify-between mb-8">
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              if (ref) inputs.current[index] = ref;
            }}
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
            onFocus={() => setFocusedIndex(index)}
            onBlur={() => setFocusedIndex(null)}
            keyboardType="number-pad"
            maxLength={1}
            className={`text-center text-xl w-10 border-b-2 ${focusedIndex === index
              ? "border-orange-500"
              : "border-gray-400"
              }`}
          />
        ))}
      </View>

      {/* Bộ đếm OTP */}
      <Text className="text-center text-gray-500 mb-4">
        {timer > 0
          ? `Mã OTP sẽ hết hạn sau ${formatTime(timer)}`
          : "OTP đã hết hạn. Vui lòng gửi lại mã mới."}
      </Text>

      {/* Nút xác thực */}
      <View className="h-[50px] mb-3 mt-5">
        {isButtonEnabled && timer > 0 ? (
          <GradientButton
            onPress={handleVerify}
            disabled={loadingVerify}
            className="py-3 px-5 rounded-lg items-center justify-center h-full"
          >
            {loadingVerify ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-center text-white font-semibold text-lg">
                Xác thực
              </Text>
            )}
          </GradientButton>
        ) : (
          <Pressable
            disabled
            className="bg-gray-200 py-3 px-5 rounded-lg items-center justify-center h-full"
          >
            <Text className="text-center text-gray-500 font-semibold text-lg">
              Xác thực
            </Text>
          </Pressable>
        )}
      </View>

      {/* Gửi lại OTP */}
      <View className="flex-row justify-center mt-2">
        <Text className="text-gray-500">Bạn chưa nhận được OTP? </Text>
        <Pressable disabled={timer > 0 || loadingResend} onPress={handleResendOtp}>
          {loadingResend ? (
            <ActivityIndicator size="small" color="#FB923C" />
          ) : (
            <Text
              className={`font-semibold ${timer > 0 ? "text-gray-400" : "text-orange-500"
                }`}
            >
              Gửi lại OTP
            </Text>
          )}
        </Pressable>

      </View>

      {/* Modal lỗi */}
      <Modal
        visible={showFailModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFailModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white w-4/5 p-6 rounded-2xl items-center">
            <Text className="text-lg font-semibold mb-3 text-red-600">
              Xác thực thất bại
            </Text>
            <Text className="text-center mb-5">
              Mã OTP không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.
            </Text>
            <Pressable
              onPress={() => setShowFailModal(false)}
              className="bg-orange-500 px-6 py-2 rounded-lg"
            >
              <Text className="text-white font-semibold">Đóng</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
