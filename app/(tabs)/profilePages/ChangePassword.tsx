import GradientButton from "@/components/GradientButton";
import { IconPassword } from "@/components/Icons";
import { InputRow } from "@/components/InputRow";
import { useAuth } from "@/app/context/AuthContext";
import MessageModal from "@/modals/MessageModal";
import { login } from "@/service/api";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import usePost from "@/hooks/usePost";
import { updatePassword } from "@/service/api";
import ToastCustom from "@/utils/CustomToast";
import { DISABLED_OPACITY, isValidPassword, maxLengthPassword } from "@/utils/ui";
import { DEFAULT_TAB_BAR_STYLE } from "@/utils/tabBarStyle";


type RootStackParamList = {
  MainProfile: undefined;
  ChangePassword: { user: User };
};

const ChangePassword = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, "ChangePassword">>();
  const { user } = route.params;
  const { refreshToken } = useAuth();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);
  const [isChanged, setIsChanged] = useState(false);
  const [isSamePassword, setIsSamePassword] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const maxLength = maxLengthPassword;

  // Kiểm tra định dạng mật khẩu
  const oldPasswordValid = isValidPassword(oldPassword);
  const newPasswordValid = isValidPassword(newPassword);
  const confirmValid =
    confirmNewPassword === newPassword && confirmNewPassword.length > 0;

  // Theo dõi thay đổi mật khẩu
  useEffect(() => {
    const changed =
      oldPassword.length > 0 &&
      newPassword.length > 0 &&
      confirmNewPassword.length > 0;
    const samePassword = oldPassword === newPassword;
    setIsSamePassword(samePassword);
    setIsChanged(changed);
  }, [oldPassword, newPassword, confirmNewPassword]);


  const canSave = isChanged && !isSamePassword && oldPasswordValid && newPasswordValid && confirmValid;

  const handleSave = async () => {
    try {
      setLoading(true);
      const passwordData = {
        currentPassword: oldPassword,
        newPassword: newPassword,
        refreshToken: refreshToken || "",
      };
      const response = await updatePassword(passwordData);
      if (response?.success) {
        ToastCustom.success("Thành công", "Cập nhật mật khẩu thành công");
        navigation.goBack();
      } else {
        ToastCustom.error("Cập nhật mật khẩu thất bại", "Vui lòng thử lại.");
        setLoading(false);
      }
    } catch (error: any) {
      ToastCustom.error("Cập nhật mật khẩu thất bại", error?.response?.data.message || "Vui lòng thử lại.");
      setLoading(false);
    } finally {
      setLoading(false);
    }

  };

  useEffect(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
    return () => {
      navigation.getParent()?.setOptions({ tabBarStyle: DEFAULT_TAB_BAR_STYLE });
    };
  }, [navigation]);

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
          <Text className="text-base text-black mb-1 font-medium">Nhập mật khẩu cũ</Text>
          <InputRow
            icon={<IconPassword size={22} color="#fff" />}
            placeholder="Mật khẩu"
            value={oldPassword}
            onChangeText={setOldPassword}
            secure
            show={showOldPassword}
            toggle={() => setShowOldPassword(!showOldPassword)}
            valid={oldPasswordValid}
            errorMsg="Mật khẩu phải ≥ 10 ký tự, có chữ, số và ký tự đặc biệt"
            maxLength={maxLength}
          />

          {/* Mật khẩu mới */}
          <Text className="text-base text-black mb-1 font-medium mt-3">Nhập mật khẩu mới</Text>
          <InputRow
            icon={<IconPassword size={22} color="#fff" />}
            placeholder="Mật khẩu mới"
            value={newPassword}
            onChangeText={setNewPassword}
            secure
            show={showNewPassword}
            toggle={() => setShowNewPassword(!showNewPassword)}
            // mật khẩu trùng báo lỗi
            valid={newPasswordValid && !isSamePassword}
            errorMsg={
              isSamePassword
                ? "Mật khẩu mới không được trùng với mật khẩu cũ."
                : "Mật khẩu phải ≥ 10 ký tự, có chữ, số và ký tự đặc biệt"
            }
            maxLength={maxLength}
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
            maxLength={maxLength}
          />
        </View>

        {/*Lưu thay đổi */}
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

      {/* Modal báo lỗi */}
      <MessageModal
        visible={showFailModal}
        onClose={() => setShowFailModal(false)}
        title="Cập nhật thất bại"
        message="Không thể lưu mật khẩu, vui lòng thử lại."
        type="error"
      />
    </KeyboardAvoidingView>
  );
};

export default ChangePassword;
