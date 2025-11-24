import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import { IconMicro } from "@/components/Icons"; // Giả định icon mic của bạn
import Colors from "@/constants/colors";
import { useSpeechToText } from "@/hooks/useSpeechToText"; // Import hook vừa tạo

interface ChatInputProps {
  onSend: (text: string) => void;
  sending: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, sending }) => {
  const [text, setText] = useState("");

  // Callback khi STT thành công -> Tự động gửi tin nhắn
  const handleSpeechDetected = (detectedText: string) => {
    if (detectedText) {
        // setText(detectedText); // Hiển thị text lên input (tuỳ chọn)
        onSend(detectedText);  // Gửi ngay lập tức cho backend chatbot
    }
  };

  // Sử dụng hook
  const { isRecording, processing, startRecording, stopRecording } = useSpeechToText({
    onSpeechDetected: handleSpeechDetected
  });

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  };

  const handleMicPress = () => {
      if (isRecording) {
          // Nếu đang ghi mà bấm nút -> dừng thủ công
          stopRecording();
      } else {
          startRecording();
      }
  };

  return (
    <View className="border-t border-gray-200 bg-white px-3 py-2">
        
      {/* Hiển thị trạng thái ghi âm */}
      {isRecording && (
          <View className="absolute top-[-40] left-0 right-0 items-center justify-center">
              <View className="bg-red-500 px-4 py-1 rounded-full">
                  <Text className="text-white font-bold">Đang nghe...</Text>
              </View>
          </View>
      )}

      <View className="flex-row items-center">

                {/* Nút Micro */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleMicPress}
          className={`ml-1 p-2 rounded-full ${isRecording ? 'bg-red-100' : ''}`}
          accessibilityRole="button"
          disabled={processing || sending}
        >
           {processing ? (
               <ActivityIndicator size="large" color={Colors.blue_button} />
           ) : (
               <IconMicro 
                size={30} 
                color={isRecording ? "red" : Colors.blue_button} 
               />
           )}
        </TouchableOpacity>

        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={isRecording ? "Đang ghi âm..." : "Nhập tin nhắn..."}
          editable={!isRecording} // Disable input khi đang ghi âm
          multiline={false}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          className="flex-1 bg-gray-100 rounded-lg px-4 py-2 text-base"
        />
        


        {/* Nút Gửi */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleSend}
          className="ml-1 p-2"
          accessibilityRole="button"
          disabled={isRecording}
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