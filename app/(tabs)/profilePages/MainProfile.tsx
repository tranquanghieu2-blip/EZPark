import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  Switch,
  ScrollView,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/app/context/AuthContext";
import HeaderProfile from "@/components/HeaderProfile";
import {
  IconEdit,
  IconEditAccount,
  IconNotify,
  IconLanguage,
  IconPassword,
  IconHelp,
  IconContact,
  IconArchiveLock,
  IconLogout,
} from "@/components/Icons";
import NoUserLogin from "@/components/NoUserLogin";

export default function Profile() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();
  const [isEnabled, setIsEnabled] = useState(true);
  const insets = useSafeAreaInsets();
  const screenHeight = Dimensions.get("screen").height;
  const headerHeight = screenHeight * 0.3 + insets.top;

  // Nếu chưa đăng nhập
  if (!user) {
    return <NoUserLogin />;
  }

  // Nếu đã đăng nhập
  return (
    <View className="flex-1 bg-gray-50">
      {/* Header tràn lên status bar */}
      <HeaderProfile />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: headerHeight * 0.65 }}
      >
        {/* Ảnh đại diện */}
        <View className="items-center">
          <View className="relative">
            {user.avatar ? (
              <Image
                source={{ uri: user.avatar }}
                className="w-28 h-28 rounded-full border-4 border-white"
              />
            ) : (
              <View className="w-28 h-28 rounded-full bg-gray-300 border-4 border-white items-center justify-center">
                <Text className="text-3xl font-bold text-white">
                  {user.name?.[0]?.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Tên người dùng */}
        <View className="items-center mt-2">
          <Text className="text-xl font-semibold text-black">{user.name}</Text>
          <Text className="text-gray-500 mt-1">{user.username}</Text>
        </View>

        {/* Danh sách tùy chọn chính */}
        <View className="mt-5 mx-4 bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <Pressable className="flex-row items-center px-4 py-3 border-b border-gray-200 active:bg-gray-50"
            onPress={() => navigation.navigate("ChangeProfile", {user: user})}
          >
            <IconEditAccount size={20} color="#000" />
            <Text className="flex-1 ml-3 text-[15px] text-black">
              Chỉnh sửa thông tin cá nhân
            </Text>
          </Pressable>

          <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
            <IconNotify size={20} color="#000" />
            <Text className="flex-1 ml-3 text-[15px] text-black">Thông báo</Text>
            <Switch
              value={isEnabled}
              onValueChange={setIsEnabled}
              trackColor={{ false: "#d1d5db", true: "#3b82f6" }}
              thumbColor="#fff"
            />
          </View>

          <Pressable className="flex-row items-center px-4 py-3 border-b border-gray-200 active:bg-gray-50">
            <IconLanguage size={20} color="#000" />
            <Text className="flex-1 ml-3 text-[15px] text-black">Ngôn ngữ</Text>
            <Text className="text-blue-500 font-medium">Tiếng Việt</Text>
          </Pressable>

          <Pressable className="flex-row items-center px-4 py-3 active:bg-gray-50"
            onPress={() => navigation.navigate("ChangePassword", {user: user})}
          >
            <IconPassword size={20} color="#000" />
            <Text className="flex-1 ml-3 text-[15px] text-black">
              Thay đổi mật khẩu
            </Text>
          </Pressable>
        </View>

        {/* Trợ giúp & Liên hệ */}
        <View className="mt-4 mx-4 bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <Pressable className="flex-row items-center px-4 py-3 border-b border-gray-200 active:bg-gray-50">
            <IconHelp size={20} color="#000" />
            <Text className="ml-3 text-[15px] text-black">
              Giúp đỡ và hỗ trợ
            </Text>
          </Pressable>

          <Pressable className="flex-row items-center px-4 py-3 border-b border-gray-200 active:bg-gray-50">
            <IconContact size={20} color="#000" />
            <Text className="ml-3 text-[15px] text-black">Liên hệ</Text>
          </Pressable>

          <Pressable className="flex-row items-center px-4 py-3 active:bg-gray-50">
            <IconArchiveLock size={20} color="#000" />
            <Text className="ml-3 text-[15px] text-black">
              Chính sách bảo mật
            </Text>
          </Pressable>
        </View>

        {/* Đăng xuất */}
        <Pressable
          onPress={logout}
          className="flex-row items-center justify-center mx-4 mt-5 mb-8 py-3 bg-gray-200 rounded-xl active:bg-gray-200"
        >
          <IconLogout size={18} color="#000" />
          <Text className="ml-2 font-semibold text-black text-[15px]">
            Đăng xuất
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
