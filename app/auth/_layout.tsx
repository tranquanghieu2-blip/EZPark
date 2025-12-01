import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Các màn hình auth
import LoginScreen from "@/app/auth/login";
import SignupScreen from "@/app/auth/signup";
import VerifyOtpScreen from "@/app/auth/verify-otp";
import ForgotPasswordScreen from "@/app/auth/forgot-password";
import ResetPasswordScreen from "@/app/auth/reset-password";


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
