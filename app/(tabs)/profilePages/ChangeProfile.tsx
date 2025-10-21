import GradientButton from "@/components/GradientButton";
import { IconCamera, IconsPerson } from "@/components/Icons";
import { InputRow } from "@/components/InputRow";
import { useAuth } from "@/app/context/AuthContext";
import MessageModal from "@/modals/MessageModal";
import { login } from "@/service/api";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import React, { useState, useEffect, useCallback } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View, Image,
  Alert
} from "react-native";
import usePost from "@/hooks/usePost";
import { launchImageLibrary, Asset } from 'react-native-image-picker';

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

  // === helper: show alert cross-platform
  const showAlert = (title: string, message?: string) => {
    Alert.alert(title, message);
  };

  const [name, setName] = useState(user.name);
  const [showFailModal, setShowFailModal] = useState(false);
  const [isChanged, setIsChanged] = useState(false);
  const { loading, execute } = usePost(login);
  const [selectedImage, setSelectedImage] = useState<Asset | null>(null); // ảnh mới được chọn
  const [previewUri, setPreviewUri] = useState<string | undefined>(user.avatar ?? undefined);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const nameValid = /^[A-Za-zÀ-ỹ\s]+$/.test(name);
  const nameChanged = name.trim() !== (user.name ?? "").trim();
  const avatarChanged = !!selectedImage;

  const canSave = (nameChanged || avatarChanged) && nameValid && !isSaving;

  // ✅ Theo dõi thay đổi email hoặc name
  useEffect(() => {
    const changed = name !== user.name;
    setIsChanged(changed);
  }, [name, user.name]);

  const handleSave = async () => {
    console.log("Lưu thay đổi:", { name });
    // TODO: Gọi API cập nhật profile tại đây
  };

  // === Image picker
  const handlePickImage = useCallback(() => {
    launchImageLibrary(
      {
        mediaType: "photo",
        quality: 0.8,
        includeBase64: false,
      },
      (result) => {
        if (result.didCancel) return;
        if (result.errorCode) {
          showAlert("Lỗi", "Không thể mở thư viện ảnh: " + result.errorMessage);
          return;
        }
        const asset = result.assets && result.assets[0];
        if (asset) {
          setSelectedImage(asset);
          setPreviewUri(asset.uri);
        }
      }
    );
  }, []);


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
          {/* Ảnh đại diện */}
          <View className="items-center">
            <View className="relative">
              {previewUri ? (
                <Image source={{ uri: previewUri }} className="w-28 h-28 rounded-full border-4 border-white" />
              ) : (
                <View className="w-28 h-28 rounded-full bg-gray-300 border-4 border-white items-center justify-center">
                  <Text className="text-3xl font-bold text-white">
                    {name?.[0]?.toUpperCase() ?? "U"}
                  </Text>
                </View>
              )}
              <Pressable className="absolute bottom-1 right-1 bg-white p-1.5 rounded-full shadow"
                onPress={handlePickImage}
                disabled={isSaving}>
                <IconCamera size={16} color="#000" />
              </Pressable>
            </View>
          </View>


          <Text className="text-base text-black mb-1 font-medium">Nhập tên</Text>
          <InputRow
            icon={<IconsPerson size={22} color="#fff" />}
            placeholder="Họ tên"
            value={name}
            onChangeText={setName}
            valid={nameValid}
            errorMsg="Tên không được chứa ký tự đặc biệt"
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
