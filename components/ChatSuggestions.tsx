import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
interface ChatSuggestionsProps {
  suggestions: string[];
  onSelect: (text: string) => void;
}

const ChatSuggestions: React.FC<ChatSuggestionsProps> = ({
  suggestions,
  onSelect,
}) => (
  <View className="px-4 flex-1 justify-center">
    <Text className="text-lg font-semibold text-gray-800 mb-3 text-center">Gợi ý</Text>
    <View className="flex-row flex-wrap justify-center">
      {suggestions.map((s, i) => (
        <TouchableOpacity
          key={i}
          activeOpacity={0.75}
          className="bg-gray-100 px-4 py-2 rounded-full mr-3 mb-3"
          onPress={() => onSelect(s)}
        >
          <Text className="text-sm text-gray-800 text-center p-1">{s}</Text>
        </TouchableOpacity>
      ))}
    </View>
    <View className="px-4 mt-4">
      <Text className="text-sm text-gray-500 text-center">
        Hoặc nhập câu hỏi của bạn bên dưới để bắt đầu trò chuyện.
      </Text>
    </View>
  </View>
);
export default ChatSuggestions;