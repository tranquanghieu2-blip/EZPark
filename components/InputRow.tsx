 import GradientWrapper from "@/components/GradientWrapper";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import React from "react";
import {
    Pressable,
    Text,
    TextInput,
    View
} from "react-native";
 export const InputRow = ({
    icon,
    placeholder,
    value,
    onChangeText,
    secure,
    show,
    toggle,
    valid,
    errorMsg,
  }: any) => (
    <View className="mb-3">
      <View className="flex-row items-center border border-red-300 rounded-lg overflow-hidden h-[50px]">
        <GradientWrapper style="px-3 py-3 h-full w-[15%] items-center">
          {icon}
        </GradientWrapper>

        <TextInput
          placeholder={placeholder}
          secureTextEntry={secure && !show}
          placeholderTextColor="#999"
          className="flex-1 px-3 py-2 text-gray-800"
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {secure && (
          <Pressable onPress={toggle} className="px-3">
            <Ionicons
              name={show ? "eye-off" : "eye"}
              size={24}
              color="#8C8C8C"
            />
          </Pressable>
        )}

        {valid && (
          <View className="px-3">
            <Ionicons name="checkmark-circle" size={24} color="green" />
          </View>
        )}
      </View>

      {!valid && value.length > 0 && (
        <Text className="text-red-500 text-sm mt-1">{errorMsg}</Text>
      )}
    </View>
  );