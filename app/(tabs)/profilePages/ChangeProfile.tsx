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
import { DISABLED_OPACITY } from "@/utils/ui";

type RootStackParamList = {
  MainProfile: undefined;
  ChangeProfile: { user: User };
};

const ChangeProfile = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, "ChangeProfile">>();
  const { user } = route.params;
  const { updateUser } = useAuth();

  const showAlert = (title: string, message?: string) => {
    Alert.alert(title, message);
  };

  const [name, setName] = useState(user.name);
  const [showFailModal, setShowFailModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<Asset | null>(null);
  const [previewUri, setPreviewUri] = useState<string | undefined>(user.avatar ?? undefined);
  const [loading, setLoading] = useState<boolean>(false);

  const trimmedName = name.trim();
  const nameValid =
    trimmedName.length > 0 && /^[A-Za-zÀ-ỹ]+(?:\s[A-Za-zÀ-ỹ]+)*$/.test(trimmedName);
  const nameChanged = trimmedName !== (user.name ?? "").trim();
  const avatarChanged = !!selectedImage;

  const canSave = (nameChanged || avatarChanged) && nameValid;

  // --- Pick image ---
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

  // --- Save profile ---
  const handleSave = async () => {
    if (!canSave) return;

    setLoading(true);
    try {
      const profileData: {
        name?: string;
        avatar?: { uri: string; type?: string; fileName?: string } | null;
      } = {};

      if (nameChanged) profileData.name = name;
      if (avatarChanged && selectedImage) {
        profileData.avatar = {
          uri: selectedImage.uri!,
          type: selectedImage.type,
          fileName: selectedImage.fileName,
        };
      }

      const updatedUser = await updateUserProfile(profileData);
      if (!updatedUser) throw new Error("Dữ liệu người dùng không hợp lệ");

      await updateUser(updatedUser);
      ToastCustom.success("Thành công", "Thông tin của bạn đã được cập nhật!");
      navigation.goBack();
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
        {/* Ảnh đại diện */}
        <View className="items-center mb-5">
          <View className="relative">
            {previewUri ? (
              <Image
                source={{ uri: previewUri }}
                className="w-28 h-28 rounded-full border-4 border-white"
              />
            ) : (
              <View className="w-28 h-28 rounded-full bg-gray-300 border-4 border-white items-center justify-center">
                <Text className="text-3xl font-bold text-white">
                  {name?.[0]?.toUpperCase() ?? "U"}
                </Text>
              </View>
            )}
            <Pressable
              className="absolute bottom-1 right-1 bg-white p-1.5 rounded-full shadow"
              onPress={handlePickImage}
              disabled={loading}
            >
              <IconCamera size={16} color="#000" />
            </Pressable>
          </View>
        </View>

        {/* Input Name */}
        <Text className="text-base text-black mb-1 font-medium">Nhập tên</Text>
        <InputRow
          icon={<IconsPerson size={22} color="#fff" />}
          placeholder="Họ tên"
          value={name}
          onChangeText={setName}
          valid={nameValid}
          errorMsg="Tên không được chứa ký tự đặc biệt"
        />

        {/* Button */}
        <View className="h-[50px] mb-3 mt-5">

          <GradientButton
            onPress={handleSave}
            disabled={loading || !canSave}
            className={`py-3 px-5 rounded-lg items-center justify-center h-full ${canSave ? `opacity-${DISABLED_OPACITY}` : 'opacity-100'}`}
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
};

export default ChangeProfile;
