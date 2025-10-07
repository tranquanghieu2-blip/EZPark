import React from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";

export default function Profile() {
  const router = useRouter();
  const isLoggedIn = false; // TODO: thay bằng context/state thực tế

  return (
    <View className="flex-1 justify-center items-center bg-white">
      {isLoggedIn ? (
        <>
          <Text className="text-lg font-semibold mb-2">Xin chào, User!</Text>
          <Text>Email: user@example.com</Text>
        </>
      ) : (
        <>
          <Text className="mb-4 text-lg">
            Vui lòng đăng nhập để sử dụng chức năng này
          </Text>
          <Pressable
            onPress={() => router.push("/auth/login")}
            className="px-4 py-2 bg-blue-500 rounded-lg"
          >
            <Text className="text-white font-semibold">Đăng nhập</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}
