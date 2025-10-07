import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Các màn hình auth
import LoginScreen from "@/app/auth/login";
import SignupScreen from "@/app/auth/signup";
import VerifyOtpScreen from "@/app/auth/verify-otp";
import ForgotPasswordScreen from "@/app/auth/forgot-password";


const Stack = createNativeStackNavigator();

export default function AuthLayout() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" component={LoginScreen} />
      <Stack.Screen name="signup" component={SignupScreen} />
      <Stack.Screen name="verify-otp" component={VerifyOtpScreen} />
      <Stack.Screen name="forgot-password" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}
