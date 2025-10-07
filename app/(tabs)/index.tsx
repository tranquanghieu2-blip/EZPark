import React from "react";
import { View, Text } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import colors from "@/constants/colors";

import ParkingSpot from "../indexTabs/parkingSpot";
import NoParkingRoute from "../indexTabs/noParkingRoute";
import SearchParkingSpot from "../indexTabs/SearchParkingSpot";

const Stack = createStackNavigator();
const TopTab = createMaterialTopTabNavigator();

const CustomTabLabel = ({ title, focused }: { title: string; focused: boolean }) => (
  <View className={`px-6 py-2 rounded-lg w-full ${focused ? "bg-blue-100" : "bg-white"}`}>
    <Text className={`font-semibold text-xl ${focused ? "text-blue-600" : "text-gray-400"}`}>
      {title}
    </Text>
  </View>
);

function TabNavigator() {
  return (
    <View className="flex-1 bg-white pt-6">
      <TopTab.Navigator
        screenOptions={{
          tabBarIndicatorStyle: { backgroundColor: colors.blue_button },
          tabBarStyle: {
            backgroundColor: "white",
            elevation: 5,
            shadowOpacity: 0,
          },
        }}
      >
        <TopTab.Screen
          name="ParkingSpot"
          component={ParkingSpot}
          options={{
            tabBarLabel: ({ focused }) => (
              <CustomTabLabel title="Điểm đỗ xe" focused={focused} />
            ),
          }}
        />
        <TopTab.Screen
          name="NoParkingRoute"
          component={NoParkingRoute}
          options={{
            tabBarLabel: ({ focused }) => (
              <CustomTabLabel title="Cấm đỗ xe" focused={focused} />
            ),
          }}
        />
      </TopTab.Navigator>
    </View>
  );
}

export default function Index() {
  return (
    <Stack.Navigator>
      {/* Tab nằm trong Stack */}
      <Stack.Screen
        name="Tabs"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      {/* Màn hình tìm kiếm */}
      <Stack.Screen
        name="SearchParkingSpot"
        component={SearchParkingSpot}
        options={{
          title: "Tìm kiếm bãi đỗ xe",
          headerTitleAlign: "center", // 👈 Căn giữa title cho cả iOS và Android
        }}
      />
    </Stack.Navigator>
  );
}
