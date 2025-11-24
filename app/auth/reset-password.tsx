import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView
} from "react-native";
import GradientButton from "@/components/GradientButton";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import ToastCustom from "@/utils/CustomToast";
import { IconPassword } from "@/components/Icons";
import { InputRow } from "@/components/InputRow";
import MessageModal from "@/modals/MessageModal";
import { resetPassword } from "@/service/api";
import { DISABLED_OPACITY, isValidPassword, maxLengthPassword } from "@/utils/ui";

// định nghĩa kiểu param
type RootStackParamList = {
  "verify-otp": { email: string; flowType: "signup" | "forgot-password" };
  login: undefined;
  "reset-password": { email: string, resetToken: string };
};

type ResetPasswordRouteProp = RouteProp<RootStackParamList, "reset-password">;

const ResetPassword = () => {
  const route = useRoute<ResetPasswordRouteProp>();
  const navigation = useNavigation<any>();
  const { email, resetToken } = route.params;
  // console.log("ResetPassword received email:", email);
  // console.log("ResetPassword received code:", code);


  const [password, setPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);
  const [isChanged, setIsChanged] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Kiểm tra định dạng mật khẩu
  
  const passwordValid = isValidPassword(password);
  const confirmValid =
    confirmNewPassword === password && confirmNewPassword.length > 0;

  // Theo dõi thay đổi mật khẩu
  useEffect(() => {
    const changed =
      password.length > 0 &&
      confirmNewPassword.length > 0;
    const samePassword = password === confirmNewPassword;
    setIsChanged(changed);
  }, [password, confirmNewPassword]);

  // Chỉ hiển thị nút khi hợp lệ & không trùng mật khẩu
  const canSave =
    isChanged && passwordValid && confirmValid;

  const handleSave = async () => {
    console.log("Lưu thay đổi:", { password });
    try {
      setLoading(true);
      const res = await resetPassword(email, resetToken, password);
      if (res.success) {
        ToastCustom.success("Cập nhật mật khẩu thành công", "Bạn đã cập nhật mật khẩu thành công. Vui lòng đăng nhập lại.");
        navigation.navigate("login");
      } else {
        throw new Error(res.message || "Lỗi không xác định");
      }
    } catch (error: any) {
      ToastCustom.error("Cập nhật mật khẩu thất bại", error?.response?.data.message || "Vui lòng thử lại.");
      setLoading(false);
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
        <View className="mb-3">
          {/* Mật khẩu cũ */}
          <Text className="text-base text-black mb-1 font-medium">Nhập mật khẩu</Text>
          <InputRow
            icon={<IconPassword size={22} color="#fff" />}
            placeholder="Mật khẩu"
            value={password}
            onChangeText={setPassword}
            secure
            show={showPassword}
            toggle={() => setShowPassword(!showPassword)}
            valid={passwordValid}
            errorMsg="Mật khẩu phải ≥ 10 ký tự, có chữ và số"
            maxLength={maxLengthPassword}
          />

        
          {/* Xác nhận mật khẩu */}
          <Text className="text-base text-black mb-1 font-medium mt-3">
            Xác nhận mật khẩu mới
          </Text>
          <InputRow
            icon={<IconPassword size={22} color="#fff" />}
            placeholder="Xác nhận mật khẩu mới"
            value={confirmNewPassword}
            onChangeText={setConfirmNewPassword}
            secure
            show={showConfirmPassword}
            toggle={() => setShowConfirmPassword(!showConfirmPassword)}
            valid={confirmValid}
            errorMsg="Mật khẩu xác nhận không trùng khớp"
            maxLength={maxLengthPassword}
          />
        </View>

        {/* ==== Nút Lưu thay đổi ==== */}
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
                  Cập nhật mật khẩu
                </Text>
              )}
            </GradientButton>
          
        </View>
      </ScrollView>

      {/* Modal thông báo lỗi */}
      <MessageModal
        visible={showFailModal}
        onClose={() => setShowFailModal(false)}
        title="Cập nhật thất bại"
        message="Không thể lưu mật khẩu, vui lòng thử lại."
        type="error"
      />
    </KeyboardAvoidingView>
  );
}

export default ResetPassword