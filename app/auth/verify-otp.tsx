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
import { verifyOtp } from "@/service/api";

// ✅ định nghĩa kiểu param
type RootStackParamList = {
  "verify-otp": { email: string };
  login: undefined;
};

type VerifyOtpRouteProp = RouteProp<RootStackParamList, "verify-otp">;

export default function VerifyOTP() {
  const route = useRoute<VerifyOtpRouteProp>();
  const navigation = useNavigation();
  const { email } = route.params;

  useEffect(() => {
    console.log("Email nhận từ SignUp:", email);
  }, []);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [timer, setTimer] = useState(60);
  // const [loading, setLoading] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);

  const inputs = useRef<TextInput[]>([]);

  const { loading, execute } = usePost(verifyOtp);

  // Bộ đếm 60s
  useEffect(() => {
    if (timer <= 0) return;
    const countdown = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) clearInterval(countdown);
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(countdown);
  }, []); // chỉ chạy 1 lần


  // Reset OTP nếu hết thời gian
  useEffect(() => {
    if (timer === 0) {
      setOtp(["", "", "", "", "", ""]);
    }
  }, [timer]);

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

  // API xác thực OTP
  const handleVerify = async () => {
    const code = otp.join("");
    if (timer === 0) {
      alert("OTP đã hết hạn. Vui lòng gửi lại mã mới!");
      return;
    }

    if (code.length < 6) {
      alert("Vui lòng nhập đầy đủ 6 số OTP.");
      return;
    }

    console.log("Xác thực OTP:", code, "cho email:", email);

    try {
      const res = await execute(email, code);
      console.log("Đăng ký thành công:", res);
      navigation.navigate("login" as never); // ✅ quay về login
    } catch (err) {
      setShowFailModal(true);
    }
  };

  const resendOtp = () => {
    console.log("Gửi lại OTP mới...");
    setTimer(60);
    setOtp(["", "", "", "", "", ""]);
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
          ? `Mã OTP sẽ hết hạn sau ${timer}s`
          : "OTP đã hết hạn. Vui lòng gửi lại mã mới."}
      </Text>

      {/* Nút xác thực */}
      <View className="h-[50px] mb-3 mt-5">
        <GradientButton
          onPress={handleVerify}
          disabled={loading || timer === 0}
          className="py-3 px-5 rounded-lg items-center justify-center h-full"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-center text-white font-semibold text-lg">
              Xác thực
            </Text>
          )}
        </GradientButton>
      </View>

      {/* Gửi lại OTP */}
      <View className="flex-row justify-center mt-2">
        <Text className="text-gray-500">Bạn chưa nhận được OTP? </Text>
        <Pressable
          disabled={timer > 0}
          onPress={resendOtp}
        >
          <Text
            className={`font-semibold ${timer > 0 ? "text-gray-400" : "text-orange-500"
              }`}
          >
            Gửi lại OTP
          </Text>
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
