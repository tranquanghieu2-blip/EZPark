import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { ImageBackground, Text, View } from 'react-native'
import { images } from "@/constants/images"
import { IconsMap, IconsHeart, IconsPerson } from "@/components/Icons";
import { DEFAULT_TAB_BAR_STYLE } from "@/utils/tabBarStyle";

import Index from "./index";
import Favourite from "./favourite";
import ProfileStack from "./profilePages/profileStack";
import { SafeAreaView } from "react-native-safe-area-context";

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
                min-h-[50px] mt-10 gap-2 px-1 justify-center items-center rounded-full overflow-hidden'
      >

        <Icon size={20} color={color} className='' />
        <Text className='text-secondary text-lg font-semibold'>{title}</Text>
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
    <SafeAreaView className="flex-1" edges={["bottom"]}>
      <Tab.Navigator
        screenOptions={
          {
            headerShown: false,
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
          component={ProfileStack}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon={IconsPerson} title="Tài khoản" />
            ),
          }}
        />
      </Tab.Navigator>
    </SafeAreaView>
    
  );
};



export default _Layout;
