import React from "react";
import { View, Text, Image } from "react-native";
import { images } from "@/constants/images";
import { formatMessageTime } from "@/utils/formatMessageTime";


interface ChatMessageProps {
  message: ChatMessage;
}

// Component hiển thị 1 bong bóng tin nhắn
const MessageBubble = ({
  isUser,
  text,
  created_at,
  intent,
  search_method,
}: {
  isUser: boolean;
  text: string;
  created_at: string;
  intent?: string;
  search_method?: string;
}) => (
  <View
    className={`px-4 mb-3 w-full ${isUser ? "items-end" : "items-start"}`}
    accessible
    accessibilityRole="text"
  >
    <View className={`flex-row ${isUser ? "justify-end" : ""}`}>
      {/* Avatar bot */}
      {!isUser && (
        <Image
          source={images.chatbot}
          className="w-8 h-8 rounded-full mr-2 self-end border-blue-600"
          style={{ borderWidth: 2 }}
        />
      )}

      {/* Bong bóng */}
      <View
        className={`max-w-[80%] px-4 py-2 rounded-2xl ${
          isUser
            ? "bg-blue-600 rounded-br-none"
            : "bg-gray-200 rounded-tl-none"
        }`}
      >
        <Text className={`${isUser ? "text-white" : "text-black"} text-base`}>
          {text}
        </Text>

        {/* Intent & Search method */}
        {/* {!isUser && (intent || search_method) && (
          <View className="mt-2">
            {intent && (
              <Text className="text-xs text-gray-500">🎯 Intent: {intent}</Text>
            )}
            {search_method && (
              <Text className="text-xs text-gray-500">
                🔍 Search: {search_method}
              </Text>
            )}
          </View>
        )} */}
      </View>
    </View>

    {/* Thời gian */}
    <Text
      className={`text-xs mt-1 ${
        isUser ? "text-blue-400 pr-2" : "text-gray-400 pl-10"
      }`}
    >
      {formatMessageTime(created_at)}
    </Text>
  </View>
);

// Component chính hiển thị cả 2 chiều chat (user + bot)
const ChatMessage: React.FC<ChatMessageProps> = React.memo(({ message }) => {
  return (
    <>
    {/* Tin nhắn bot */}
      {message.llm_response && (
        <MessageBubble
          isUser={false}
          text={message.llm_response}
          created_at={message.created_at}
          intent={message.intent}
          search_method={message.search_method}
        />
      )}

      {/* Tin nhắn user */}
      {message.user_query && (
        <MessageBubble
          isUser
          text={message.user_query}
          created_at={message.created_at}
        />
      )}

      
    </>
  );
});

export default ChatMessage;
