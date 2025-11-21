import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Text } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import { IconMicro } from "@/components/Icons";
import Colors from "@/constants/colors";
import { maxLengthChatBot } from "@/utils/ui";

interface ChatInputProps {
  onSend: (text: string) => void;
  sending: boolean;
}

const MAX_LENGTH = maxLengthChatBot;

const ChatInput: React.FC<ChatInputProps> = ({ onSend, sending }) => {
  const [text, setText] = useState("");

  const handleChange = (value: string) => {
    if (value.length <= MAX_LENGTH) {
      setText(value);
    }
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <View className="border-t border-gray-200 bg-white px-3 py-2">
      <View className="flex-row items-center">
        <View className="flex-1">
          <TextInput
            value={text}
            onChangeText={handleChange}
            placeholder="Nhập tin nhắn..."
            multiline={true}
            maxLength={MAX_LENGTH}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            className="bg-gray-100 rounded-lg px-4 py-2 text-base"     
          />

          {/* Bộ đếm ký tự */}
          {/* <Text className="text-right text-xs text-gray-500 mt-1">
            {text.length}/{MAX_LENGTH}
          </Text> */}
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => alert("Chức năng ghi âm chưa được hỗ trợ.")}
          className="ml-1 p-2"
        >
          <IconMicro size={22} color={Colors.blue_button} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleSend}
          className="ml-1 p-2"
        >
          {sending ? (
            <Text className="text-blue-600">...</Text>
          ) : (
            <Ionicons name="send" size={22} color={Colors.blue_button} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ChatInput;
