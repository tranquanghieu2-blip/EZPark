import GradientButton from "@/components/GradientButton";
import { IconCamera, IconsPerson } from "@/components/Icons";
import { InputRow } from "@/components/InputRow";
import { useAuth } from "@/app/context/AuthContext";
import MessageModal from "@/modals/MessageModal";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import React, { useState, useEffect, useCallback } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  Image,
  Alert
} from "react-native";
import { sendPasswordResetOtp } from "@/service/api";
import ToastCustom from "@/utils/CustomToast";
import { DISABLED_OPACITY } from "@/utils/ui";

type RootStackParamList = {
  MainProfile: undefined;
  ChangeProfile: { user: User };
};

const ForgotPassword = () => {
  const navigation = useNavigation<any>();

  const [email, setEmail] = useState("");
  const [showFailModal, setShowFailModal] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);

  const trimmedEmail = email.trim();
  const emailValid =
    trimmedEmail.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);


  const canSave = emailValid;

  // --- Save profile ---
const handleSave = async () => {
  if (!canSave) return;

  setLoading(true);
  try {
    const res = await sendPasswordResetOtp(trimmedEmail);

    if (res.success) {
      ToastCustom.success("Thành công", "Mã OTP đã được gửi đến email của bạn.");
      navigation.navigate("verify-otp", {
        email: trimmedEmail,
        flowType: "forgot-password",
      });
    } else {
      throw new Error(res.message || "Gửi OTP thất bại.");
    }
  } catch (error: any) {
    console.error("Lỗi gửi OTP:", error);
    ToastCustom.error("Lỗi", error.message || "Không thể gửi mã OTP, vui lòng thử lại.");
  } finally {
    setLoading(false);
  }
};


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >

        {/* Input Name */}
        <Text className="text-base text-black mb-1 font-medium">Nhập email của bạn</Text>
        <InputRow
          icon={<IconsPerson size={22} color="#fff" />}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          valid={emailValid}
          errorMsg="Email không hợp lệ"
        />

        {/* Button */}
        <View className="h-[50px] mb-3 mt-5">
          
            <GradientButton
              onPress={handleSave}
              disabled={loading}
              className={`py-3 px-5 rounded-lg items-center justify-center h-full ${!canSave ? `opacity-${DISABLED_OPACITY}` : "opacity-100"}`}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-center text-white font-semibold text-lg">
                  Lưu thay đổi
                </Text>
              )}
            </GradientButton>
          
        </View>
      </ScrollView>

      {/* Modal lỗi */}
      <MessageModal
        visible={showFailModal}
        onClose={() => setShowFailModal(false)}
        title="Cập nhật thất bại"
        message="Không thể lưu thay đổi, vui lòng thử lại."
        type="error"
      />
    </KeyboardAvoidingView>
  );
}

export default ForgotPassword