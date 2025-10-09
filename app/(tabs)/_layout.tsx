import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { ImageBackground, Text, View } from 'react-native'
import { images } from "@/constants/images"
import { IconsMap, IconsHeart, IconsPerson } from "@/components/Icons";
import { DEFAULT_TAB_BAR_STYLE } from "@/utils/tabBarStyle";

import Index from "./index";
import Favourite from "./favourite";
import Profile from "./profile";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Component cho từng icon trong tab
const TabIcon = ({ focused, icon: Icon, title }: any) => {
  const color = focused ? "#FFFFFF" : "#A8B5DB";
  if (focused) {
    return (
      <ImageBackground
        source={images.bottomNavItem}
        className='flex flex-row w-full flex-1 min-w-[112px]
                min-h-[50px] mt-10 gap-2 justify-center items-center rounded-full overflow-hidden'
      >

        <Icon size={20} color={color} className='ml-5' />
        <Text className='text-secondary text-lg font-semibold mr-5'>{title}</Text>
      </ImageBackground>
    );
  }

  return (
    <View className='size-full justify-center items-center mt-10 rounded-full'>
      <Icon size={24} color="#999" />
    </View>
  );
};

const _Layout = () => {
  return (
    <Tab.Navigator
      screenOptions={
        {
          headerShown: false, // 👈 thêm dòng này để ẩn chữ "index"
          tabBarShowLabel: false,
          animation: "shift",
          tabBarItemStyle: {
            display: "flex",
            width: "100%",
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
          },
          tabBarStyle: DEFAULT_TAB_BAR_STYLE
        }
      }
    >
      <Tab.Screen
        name="index"
        component={Index}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={IconsMap} title="Bản đồ" />
          ),
        }}
      />
      <Tab.Screen
        name="favourite"
        component={Favourite}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={IconsHeart} title="Yêu thích" />
          ),
        }}
      />
      <Tab.Screen
        name="profile"
        component={Profile}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={IconsPerson} title="Tài khoản" />
          ),
        }}
      />
    </Tab.Navigator>
  );
};



export default _Layout;
