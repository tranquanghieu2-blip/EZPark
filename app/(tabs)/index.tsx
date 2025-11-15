import React from "react";
import { View, Text } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import colors from "@/constants/colors";
import ChatHeader from "@/components/ChatHeader";

import ParkingSpot from "../indexTabs/parkingSpot1";
import NoParkingRoute from "../indexTabs/noParkingRoute";
import SearchParkingSpot from "../indexTabs/SearchParkingSpot";
import ParkingSpotDetail from "../indexTabs/ParkingSpotDetail";
import Rating from "../indexTabs/Rating";
import ChatBot from "../indexTabs/ChatBot";
import { SafeAreaView } from "react-native-safe-area-context";
import SearchNoParkingRoute from "../indexTabs/SearchNoParkingRoute";

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
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
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
            swipeEnabled: false,
            tabBarLabel: ({ focused }) => (
              <CustomTabLabel title="Điểm đỗ xe" focused={focused} />
            ),
          }}
        />
        <TopTab.Screen
          name="NoParkingRoute"
          component={NoParkingRoute}
          options={{
            swipeEnabled: false,
            tabBarLabel: ({ focused }) => (
              <CustomTabLabel title="Cấm đỗ xe" focused={focused} />
            ),
          }}
        />

      </TopTab.Navigator>
    </SafeAreaView>
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
          headerTitleAlign: "center",
        }}
      />
      <Stack.Screen
        name="ParkingSpotDetail"
        component={ParkingSpotDetail}
        options={{
          title: "Chi tiết bãi đỗ xe",
          headerTitleAlign: "center",
        }}
      />
      <Stack.Screen
        name="Rating"
        component={Rating}
        options={{
          title: "Đánh giá của bạn",
          headerTitleAlign: "center",
        }}
      />
      <Stack.Screen
        name="ChatBot"
        component={ChatBot}
        options={{
          header: () => <ChatHeader />,
        }}
      />
      <Stack.Screen
        name="SearchNoParkingRoute"
        component={SearchNoParkingRoute}
        options={{
          title: "Tìm kiếm tuyến đường cấm đỗ xe",
          headerTitleAlign: "center",
        }}
      />
    </Stack.Navigator>
  );
}
