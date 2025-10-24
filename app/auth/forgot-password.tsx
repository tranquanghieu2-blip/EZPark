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
import { launchImageLibrary, Asset } from "react-native-image-picker";
import { updateUserProfile } from "@/service/api";
import ToastCustom from "@/utils/CustomToast";

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
      // const res = await updateUserProfile({ email: trimmedEmail });
      // console.log("Cập nhật profile thành công:", res);
      ToastCustom.success("Thành công", "Cập nhật thông tin thành công.");
      navigation.navigate("verify-otp", { email, flowType: "forgot-password" });
    } catch (error) {
      console.error("Lỗi cập nhật profile:", error);
      ToastCustom.error("Lỗi", "Không thể lưu thay đổi, vui lòng thử lại.");
      setShowFailModal(true);
    } finally {
      setLoading(false); // đảm bảo tắt loading ở cuối cùng
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
          {canSave ? (
            <GradientButton
              onPress={handleSave}
              disabled={loading}
              className="py-3 px-5 rounded-lg items-center justify-center h-full"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-center text-white font-semibold text-lg">
                  Lưu thay đổi
                </Text>
              )}
            </GradientButton>
          ) : (
            <Pressable
              disabled
              className="bg-gray-200 py-3 px-5 rounded-lg items-center justify-center h-full"
            >
              <Text className="text-center text-gray-600 font-semibold text-lg">
                Lưu thay đổi
              </Text>
            </Pressable>
          )}
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