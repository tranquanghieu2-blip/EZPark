import GradientButton from "@/components/GradientButton";
import GradientText from "@/components/GradientText";
import GradientWrapper from "@/components/GradientWrapper";
import { IconEmail, IconPassword, IconsPerson } from "@/components/Icons";
import { icons } from "@/constants/icons";
import usePost from "@/hooks/usePost";
import MessageModal from "@/modals/MessageModal";
import { signUp } from "@/service/api";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  TextInput,
  View
} from "react-native";
import { InputRow } from "@/components/InputRow";

export default function SignUp() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);

  const { loading, execute, error } = usePost(signUp);

  // validate logic
  const emailValid = /^\S+@\S+\.\S+$/.test(email);
  const nameValid = /^[A-Za-zÀ-ỹ]+(?:\s[A-Za-zÀ-ỹ]+)*$/.test(name);
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
      navigation.navigate("verify-otp", { email, password, name, flowType: "signup" });
    } catch (err) {
      setShowFailModal(true);
    }

  };

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
        <Pressable onPress={() => navigation.navigate("login" as never)}>
          <Text className="text-orange-500 font-semibold">Đăng nhập</Text>
        </Pressable>
      </View>

      {/* Modal thông báo lỗi */}
      <MessageModal
        visible={showFailModal}
        onClose={() => setShowFailModal(false)}
        title="Đăng ký thất bại"
        message={error ? error.message : "Vui lòng thử lại sau"}
        type="error"
      />

    </KeyboardAwareScrollView>
  );

}
