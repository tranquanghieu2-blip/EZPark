import GradientWrapper from "@/components/GradientWrapper";
import Ionicons from "@react-native-vector-icons/ionicons";
import React from "react";
import {
  Pressable,
  Text,
  TextInput,
  View
} from "react-native";

type InputRowProps = {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secure?: boolean;
  show?: boolean;
  toggle?: () => void;
  valid?: boolean;          
  errorMsg?: string;
  maxLength?: number;
};

export const InputRow = ({
  icon,
  placeholder,
  value,
  onChangeText,
  secure = false,
  show = false,
  toggle,
  valid,
  errorMsg,
  maxLength = 100,
}: InputRowProps) => {

  const isOverLimit = value.length > maxLength;   
  const showError = (!valid && value.length > 0) || isOverLimit;

  return (
    <View className="mb-3">

      <View
        className={`flex-row items-center rounded-lg overflow-hidden h-[50px] 
        border ${showError ? "border-red-400" : "border-gray-300"}`}
      >
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

        {/* Eye toggle */}
        {secure && toggle && (
          <Pressable onPress={toggle} className="px-3">
            <Ionicons
              name={show ? "eye-off" : "eye"}
              size={22}
              color="#8C8C8C"
            />
          </Pressable>
        )}

        {/* Checkmark only if valid AND not exceeding limit */}
        {valid && !isOverLimit && (
          <View className="px-3">
            <Ionicons name="checkmark-circle" size={22} color="green" />
          </View>
        )}
      </View>

      {/* Error messages */}
      {showError && (
        <Text className="text-red-500 text-sm mt-1">
          {isOverLimit
            ? `Không được vượt quá ${maxLength} ký tự`
            : errorMsg}
        </Text>
      )}

    </View>
  );
};
