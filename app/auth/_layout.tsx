import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Các màn hình auth
import LoginScreen from "@/app/auth/Login";
import SignupScreen from "@/app/auth/Signup";
import VerifyOtpScreen from "@/app/auth/VerifyOTP";
import ForgotPasswordScreen from "@/app/auth/ForgotPassword";
import ResetPasswordScreen from "@/app/auth/ResetPassword";


const Stack = createNativeStackNavigator();

export default function AuthLayout() {
  return (
    <Stack.Navigator
        screenOptions={{
          headerTitleAlign: "center", 
        }}
    >
      <Stack.Screen
        name="login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="signup"
        component={SignupScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="verify-otp"
        component={VerifyOtpScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="forgot-password"
        component={ForgotPasswordScreen}
        options={{ title: "Quên mật khẩu" }}
      />
      <Stack.Screen
        name="reset-password"
        component={ResetPasswordScreen}
        options={{ title: "Đặt lại mật khẩu" }}
      />
    </Stack.Navigator>
  );

}
