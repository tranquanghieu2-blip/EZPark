import GradientButton from "@/components/GradientButton";
import { IconEmail, IconsPerson } from "@/components/Icons";
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

// ================= Type định nghĩa =================
type RootStackParamList = {
  MainProfile: undefined;
  ChangeProfile: { user: User };
};

const ChangeProfile = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, "ChangeProfile">>();
  const { user } = route.params;
  const { login: saveAuth } = useAuth();

  const [email, setEmail] = useState(user.username);
  const [name, setName] = useState(user.name);
  const [showFailModal, setShowFailModal] = useState(false);
  const [isChanged, setIsChanged] = useState(false);

  const { loading, execute } = usePost(login);

  // ✅ Kiểm tra hợp lệ
  const emailValid = /^\S+@\S+\.\S+$/.test(email);
  const nameValid = /^[A-Za-zÀ-ỹ\s]+$/.test(name);

  // ✅ Theo dõi thay đổi email hoặc name
  useEffect(() => {
    const changed = email !== user.username || name !== user.name;
    setIsChanged(changed);
  }, [email, name, user.username, user.name]);

  // ✅ Điều kiện để hiển thị nút GradientButton
  const canSave = isChanged && emailValid && nameValid;

  const handleSave = async () => {
    console.log("Lưu thay đổi:", { name, email });
    // TODO: Gọi API cập nhật profile tại đây
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
          <Text className="text-base text-black mb-1 font-medium">Nhập tên</Text>
          <InputRow
            icon={<IconsPerson size={22} color="#fff" />}
            placeholder="Họ tên"
            value={name}
            onChangeText={setName}
            valid={nameValid}
            errorMsg="Tên không được chứa ký tự đặc biệt"
          />

          <Text className="text-base text-black mb-1 font-medium mt-3">Nhập email</Text>
          <InputRow
            icon={<IconEmail size={24} color="#fff" />}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            valid={emailValid}
            errorMsg="Email không hợp lệ"
          />
        </View>

        {/* ==== Nút Lưu thay đổi ==== */}
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

      {/* Modal thông báo lỗi */}
      <MessageModal
        visible={showFailModal}
        onClose={() => setShowFailModal(false)}
        title="Cập nhật thất bại"
        message="Không thể lưu thay đổi, vui lòng thử lại."
        type="error"
      />
    </KeyboardAvoidingView>
  );
};

export default ChangeProfile;
