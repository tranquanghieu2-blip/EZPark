// app/profile/profileStack.tsx
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import Profile from "./MainProfile";
import ChangeProfile from "./ChangeProfile";
import ChangePassword from "./ChangePassword";

const Stack = createStackNavigator();

const ProfileStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        
        headerTitleAlign: "center",
        headerStyle: { backgroundColor: "#fff" },
        headerTitleStyle: { fontWeight: "600", fontSize: 18 },
      }}
    >
      <Stack.Screen
        name="Profile"
        component={Profile}
        options={{ title: "Tài khoản", headerShown: false }}
        
      />
      <Stack.Screen
        name="ChangeProfile"
        component={ChangeProfile}
        options={{ title: "Chỉnh sửa thông tin" , headerShown: true}}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePassword}
        options={{ title: "Thay đổi mật khẩu" }}
      />
    </Stack.Navigator>
  );
};

export default ProfileStack;
