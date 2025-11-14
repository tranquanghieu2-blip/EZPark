import React, { useEffect, useRef } from "react";
import { View, Text, Animated, Easing, Image } from "react-native";
import { images } from "@/constants/images";

const BotTypingBubble: React.FC = () => {
  // Tạo 3 animation cho 3 dấu chấm
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnimation = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot, {
            toValue: -4, // nhấc lên 4px
            duration: 300,
            easing: Easing.linear,
            useNativeDriver: true,
            delay,
          }),
          Animated.timing(dot, {
            toValue: 0, // hạ xuống
            duration: 300,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      );

    const anim1 = createAnimation(dot1, 0);
    const anim2 = createAnimation(dot2, 150);
    const anim3 = createAnimation(dot3, 300);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View className="px-4 mb-3 w-full items-start">
      <View className="flex-row">
        {/* Avatar bot */}
        <Image
          source={images.chatbot}
          className="w-8 h-8 rounded-full mr-2 self-end border-blue-600"
          style={{ borderWidth: 2 }}
        />

        {/* Bong bóng chat */}
        <View className="max-w-[80%] bg-gray-200 px-4 py-2 rounded-2xl rounded-tl-none flex-row justify-center items-end">
          <Animated.Text
            className="text-black text-base font-bold"
            style={{ transform: [{ translateY: dot1 }] }}
          >
            •
          </Animated.Text>
          <Animated.Text
            className="text-black text-base font-bold"
            style={{ transform: [{ translateY: dot2 }] }}
          >
            •
          </Animated.Text>
          <Animated.Text
            className="text-black text-base font-bold"
            style={{ transform: [{ translateY: dot3 }] }}
          >
            •
          </Animated.Text>
        </View>
      </View>
    </View>
  );
};

export default BotTypingBubble;
