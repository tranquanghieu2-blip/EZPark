import GradientButton from "@/components/GradientButton";
import GradientText from "@/components/GradientText";
import GradientWrapper from "@/components/GradientWrapper";
import { IconEmail, IconPassword, IconsPerson } from "@/components/Icons";
import { icons } from "@/constants/icons";
import usePost from "@/hooks/usePost";
import MessageModal from "@/modals/MessageModal";
import { signUp } from "@/service/api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";

export default function SignUp() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);

  const { loading, execute } = usePost(signUp);

  // validate logic
  const emailValid = /^\S+@\S+\.\S+$/.test(email);
  const nameValid = /^[A-Za-zÀ-ỹ\s]+$/.test(name);
  const passwordValid = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{10,}$/.test(password);
  const confirmValid = confirm === password && confirm.length > 0;

  const handleSignUp = async () => {
    if (!emailValid) return alert("Email không hợp lệ");
    if (!nameValid) return alert("Tên không hợp lệ");
    if (!passwordValid)
      return alert("Mật khẩu phải >= 9 ký tự, có chữ và số");
    if (!confirmValid) return alert("Mật khẩu xác nhận không trùng khớp");

    try {
      const res = await execute(email, password, name);
      console.log("Đăng ký thành công:", res);
      router.push({
        pathname: "/auth/verify-otp",
        params: { email },
      });
    } catch (err) {
      setShowFailModal(true);
    }

  };

  const InputRow = ({
    icon,
    placeholder,
    value,
    onChangeText,
    secure,
    show,
    toggle,
    valid,
    errorMsg,
  }: any) => (
    <View className="mb-3">
      <View className="flex-row items-center border border-red-500 rounded-lg overflow-hidden  h-[50px]">
        <GradientWrapper style="px-3 py-3 h-full w-[15%] items-center">
          {icon}
        </GradientWrapper>
        <TextInput
          placeholder={placeholder}
          secureTextEntry={secure && !show}
          placeholderTextColor="#999"
          className="flex-1 px-3 py-2 text-gray-800"
          value={value}
          onChangeText={onChangeText}
        />
        {secure && (
          <Pressable onPress={toggle} className="px-3">
            <Ionicons
              name={show ? "eye-off" : "eye"}
              size={24}
              color="#8C8C8C"
            />
          </Pressable>
        )}
        {valid && (
          <View className="px-3">
            <Ionicons name="checkmark-circle" size={24} color="green" />
          </View>
        )}
      </View>
      {!valid && value.length > 0 && (
        <Text className="text-red-500 text-sm mt-1">{errorMsg}</Text>
      )}
    </View>
  );

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24, backgroundColor: 'white' }}
      enableOnAndroid={true}
      extraScrollHeight={20} // đẩy thêm một chút khi bàn phím xuất hiện
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
        icon={<IconsPerson size={22} color="#fff" />}
        placeholder="Họ tên"
        value={name}
        onChangeText={setName}
        valid={nameValid}
        errorMsg="Tên không được chứa ký tự đặc biệt"
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

      <InputRow
        icon={<IconPassword size={22} color="#fff" />}
        placeholder="Xác nhận mật khẩu"
        value={confirm}
        onChangeText={setConfirm}
        secure
        show={showConfirm}
        toggle={() => setShowConfirm(!showConfirm)}
        valid={confirmValid}
        errorMsg="Mật khẩu xác nhận không trùng khớp"
      />

      {/* Button */}
      <View className="h-[50px] mb-3 mt-5">
        <GradientButton
          onPress={handleSignUp}
          disabled={loading}
          className="py-3 px-5 rounded-lg items-center justify-center h-full"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-center text-white font-semibold text-lg">
              Đăng ký
            </Text>
          )}
        </GradientButton>
      </View>

      {/* Login redirect */}
      <View className="flex-row justify-center">
        <Text className="text-gray-500">Bạn đã có tài khoản? </Text>
        <Pressable onPress={() => router.push("/auth/login")}>
          <Text className="text-orange-500 font-semibold">Đăng nhập</Text>
        </Pressable>
      </View>

      {/* Modal thông báo lỗi */}
      <MessageModal
        visible={showFailModal}
        onClose={() => setShowFailModal(false)}
        title="Đăng ký thất bại"
        message="Bạn đăng ký thất bại. Vui lòng đăng ký lại."
        type="error"
      />

    </KeyboardAwareScrollView>
  );

}
