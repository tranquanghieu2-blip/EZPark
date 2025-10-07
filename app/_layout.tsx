import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AuthLayout from "@/app/auth/_layout";
import _Layout from "@/app/(tabs)/_layout";

import "../global.css";

const Stack = createNativeStackNavigator();

export default function RootLayout() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Tabs (Main App) */}
        <Stack.Screen name="(tabs)" component={_Layout} />
        {/* Auth screens */}
        <Stack.Screen name="auth" component={AuthLayout} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
