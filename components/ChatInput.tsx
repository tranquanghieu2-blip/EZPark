import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Text } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import { IconMicro } from "@/components/Icons";
import Colors from "@/constants/colors";
interface ChatInputProps {
  onSend: (text: string) => void;
  sending: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, sending }) => {
  const [text, setText] = useState("");

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <View className="border-t border-gray-200 bg-white px-3 py-2">
      <View className="flex-row items-center">
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Nhập tin nhắn..."
          multiline={false}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          className="flex-1 bg-gray-100 rounded-lg px-4 py-2 text-base"
        />
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => alert("Chức năng ghi âm chưa được hỗ trợ.")}
          className="ml-1 p-2"
          accessibilityRole="button"
        >
          <IconMicro size={22} color={Colors.blue_button} />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleSend}
          className="ml-1 p-2"
          accessibilityRole="button"
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