import React, { useState, useRef } from "react";
import { View, Text, Pressable, TouchableOpacity, Animated } from "react-native";
import { IconDotHorizontal, IconEdit, IconDelete } from "@/components/Icons";
import Colors from "@/constants/colors";

const CustomMenu = ({ onUpdate, onDelete }: { onUpdate: () => void; onDelete: () => void }) => {
  const [visible, setVisible] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.95)).current;

  const openMenu = () => {
    setVisible(true);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();
  };

  const closeMenu = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.95, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      setVisible(false);
      callback?.();
    });
  };

  const toggleMenu = () => {
    if (visible) closeMenu();
    else openMenu();
  };

  return (
    <View className="relative">
      {/* Nút ba chấm */}
      <Pressable onPress={toggleMenu} hitSlop={8}>
        <IconDotHorizontal size={24} color="black" />
      </Pressable>

      {/* Overlay trong suốt — click ra ngoài để đóng */}
      {visible && (
        <Pressable
          onPress={() => closeMenu()}
          className="absolute top-0 left-0 right-0 bottom-0"
          style={{
            position: "absolute",
            zIndex: 10, // bảo đảm nằm trên tất cả
          }}
        />
      )}

      {/* Menu dropdown */}
      {visible && (
        <Animated.View
          style={{
            opacity,
            transform: [{ scale }],
            zIndex: 20,
            elevation: 10, // Android
          }}
          className="absolute right-0 top-7 w-36 bg-white rounded-xl shadow-lg border border-gray-200"
        >
          <TouchableOpacity
            className="px-2 py-3 flex-row items-center gap-1 active:bg-gray-100"
            onPress={() => closeMenu(onUpdate)}
            activeOpacity={0.7}
          >
            <IconEdit size={20} color={Colors.blue_button} />
            <Text className="text-black text-base font-medium">Chỉnh sửa</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="px-2 py-3 flex-row gap-1 items-center active:bg-gray-100"
            onPress={() => closeMenu(onDelete)}
            activeOpacity={0.7}
          >
            <IconDelete size={20} color={Colors.danger} />
            <Text className="text-black text-base font-medium">Xoá</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

export default CustomMenu;
