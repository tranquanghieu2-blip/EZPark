import GradientButton from "@/components/GradientButton";
import GradientText from "@/components/GradientText";
import { IconEmail, IconPassword } from "@/components/Icons";
import { InputRow } from "@/components/InputRow";
import { icons } from "@/constants/icons";
import usePost from "@/hooks/usePost";
import MessageModal from "@/modals/MessageModal";
import { GGLogin, login } from "@/service/api";
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View
} from "react-native";

export default function Login() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);

  const { loading, execute } = usePost(login);

  // Validate logic
  const emailValid = /^\S+@\S+\.\S+$/.test(email);
  const passwordValid = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{10,}$/.test(password);

  const handleLogin = async () => {
    if (!emailValid) return alert("Email không hợp lệ");
    if (!passwordValid) return alert("Mật khẩu phải >= 9 ký tự, có chữ và số");

    try {
      const res = await execute(email, password);
      console.log("Đăng nhập thành công:", res);
      
    } catch (err) {
      setShowFailModal(true);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View className="items-center mb-12">
          <Image
            source={icons.iconApp}
            style={{ width: 100, height: 100, marginBottom: 12 }}
            resizeMode="contain"
          />
          <View
            style={{ height: 70, justifyContent: "center", alignItems: "center" }}
          >
            <GradientText />
          </View>
        </View>

        {/* Inputs */}
        <InputRow
          icon={<IconEmail size={24} color="#fff" />}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          valid={emailValid}
          errorMsg="Email không hợp lệ"
        />

        <InputRow
          icon={<IconPassword size={22} color="#fff" />}
          placeholder="Mật khẩu"
          value={password}
          onChangeText={setPassword}
          secure
          show={showPassword}
          toggle={() => setShowPassword(!showPassword)}
          valid={passwordValid}
          errorMsg="Mật khẩu phải ≥ 9 ký tự, có chữ và số"
        />

        {/* Nút đăng nhập */}
        <View className="h-[50px] mb-3 mt-5">
          <GradientButton
            onPress={handleLogin}
            disabled={loading}
            className="py-3 px-5 rounded-lg items-center justify-center h-full"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-center text-white font-semibold text-lg">
                Đăng nhập
              </Text>
            )}
          </GradientButton>
        </View>

        {/* Đăng nhập bằng Google */}
        <Pressable className="bg-gray-200 py-3 rounded-lg mb-3 h-[50px] items-center justify-center flex-row gap-2"
          onPress={() => { GGLogin() }}>
          <Image source={icons.google} style={{ width: 24, height: 24 }} />
          <Text className="text-center text-black font-medium" >
            Đăng nhập bằng Google
          </Text>
        </Pressable>

        {/* Quên mật khẩu */}
        <Pressable onPress={() => navigation.navigate("forgot-password" as never)}>
          <Text className="text-center text-gray-500 mb-4">
            Bạn quên mật khẩu?
          </Text>
        </Pressable>

        {/* Divider */}
        <View className="flex-row items-center mb-4">
          <View className="flex-1 h-[1px] bg-gray-300" />
          <Text className="mx-2 text-gray-400">Hoặc</Text>
          <View className="flex-1 h-[1px] bg-gray-300" />
        </View>

        {/* Chưa có tài khoản */}
        <View className="flex-row justify-center">
          <Text className="text-gray-500">Bạn chưa có tài khoản? </Text>
          <Pressable onPress={() => navigation.navigate("signup" as never)}>
            <Text className="text-orange-500 font-semibold">Đăng ký</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Modal thông báo lỗi */}
      <MessageModal
        visible={showFailModal}
        onClose={() => setShowFailModal(false)}
        title="Đăng nhập thất bại"
        message="Sai tài khoản hoặc mật khẩu."
        type="error"
      />
    </KeyboardAvoidingView>
  );
}
