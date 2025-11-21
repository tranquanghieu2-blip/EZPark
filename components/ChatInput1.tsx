// // ================= ChatInput.tsx =================
// import React, { useEffect, useState } from "react";
// import { View, TextInput, TouchableOpacity, Text } from "react-native";
// import Ionicons from "@react-native-vector-icons/ionicons";
// import Voice, { SpeechResultsEvent } from "@react-native-voice/voice";
// import { IconMicro } from "@/components/Icons";
// import Colors from "@/constants/colors";

// interface ChatInputProps {
//   onSend: (text: string) => void;
//   sending: boolean;
// }

// const ChatInput: React.FC<ChatInputProps> = ({ onSend, sending }) => {
//   const [text, setText] = useState("");
//   const [isRecording, setIsRecording] = useState(false);

//   useEffect(() => {
//     // Định nghĩa các sự kiện của Voice
//     const onSpeechResults = (e: SpeechResultsEvent) => {
//       if (e.value && e.value.length > 0) {
//         const recognizedText = e.value[0];
//         setText(recognizedText);
//         // Tự động gửi sau khi nhận dạng xong
//         onSend(recognizedText);
//         setText("");
//       }
//     };

//     const onSpeechEnd = () => {
//       setIsRecording(false);
//     };

//     const onSpeechError = (e: any) => {
//       console.error("Speech recognition error", e);
//       setIsRecording(false);
//     };

//     // Đăng ký các listener
//     Voice.onSpeechResults = onSpeechResults;
//     Voice.onSpeechEnd = onSpeechEnd;
//     Voice.onSpeechError = onSpeechError;

//     // Hủy đăng ký khi component unmount
//     return () => {
//       Voice.destroy().then(Voice.removeAllListeners);
//     };
//   }, [onSend]);

//   const toggleRecording = async () => {
//     if (isRecording) {
//       try {
//         await Voice.stop();
//       } catch (e) {
//         console.error("Error stopping recording:", e);
//       }
//     } else {
//       try {
//         // Xóa text cũ và bắt đầu ghi âm
//         setText("");
//         await Voice.start("vi-VN"); // Bắt đầu nhận dạng với tiếng Việt
//         setIsRecording(true);
//       } catch (e) {
//         console.error("Error starting recording:", e);
//       }
//     }
//   };

//   const handleSendText = () => {
//     if (text.trim()) {
//       onSend(text);
//       setText("");
//     }
//   };

//   return (
//     <View className="border-t border-gray-200 bg-white px-3 py-2">
//       <View className="flex-row items-center">
//         <TextInput
//           value={text}
//           onChangeText={setText}
//           placeholder={isRecording ? "Đang nghe..." : "Nhập tin nhắn..."}
//           multiline={false}
//           returnKeyType="send"
//           onSubmitEditing={handleSendText}
//           editable={!isRecording}
//           className="flex-1 bg-gray-100 rounded-lg px-4 py-2 text-base"
//         />

//         <TouchableOpacity
//           activeOpacity={0.7}
//           onPress={toggleRecording}
//           className="ml-1 p-2"
//         >
//           <IconMicro
//             size={22}
//             color={isRecording ? "red" : Colors.blue_button}
//           />
//         </TouchableOpacity>

//         <TouchableOpacity
//           activeOpacity={0.7}
//           onPress={handleSendText}
//           disabled={sending || isRecording}
//           className="ml-1 p-2"
//         >
//           {sending ? (
//             <Text className="text-blue-600">...</Text>
//           ) : (
//             <Ionicons name="send" size={22} color={Colors.blue_button} />
//           )}
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// export default ChatInput;

