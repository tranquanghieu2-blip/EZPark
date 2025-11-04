import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  FlatList,
  ListRenderItem,
  Image,
  Pressable,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useNavigation } from "@react-navigation/native";
import { images } from "@/constants/images";
import { DEFAULT_TAB_BAR_STYLE } from "@/utils/tabBarStyle";
import { IconMicro } from "@/components/Icons";
import Colors from "@/constants/colors";
import { useAuth } from "../context/AuthContext";
import NoUserLogin from "@/components/NoUserLogin";

/* -------------------------------------------------
   Kiểu dữ liệu tin nhắn
-------------------------------------------------- */
type Message = {
  id: string;
  from: "user" | "bot";
  text: string;
  time: string; // thêm thời gian gửi
};

/* -------------------------------------------------
   Component: ChatMessage
-------------------------------------------------- */
interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = React.memo(({ message }) => {
  const isUser = message.from === "user";

  return (
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

        {/* Bong bóng tin nhắn */}
        <View
          className={`max-w-[80%] px-4 py-2 rounded-2xl ${isUser ? "bg-blue-600 rounded-br-none" : "bg-gray-200 rounded-tl-none"
            }`}
        >
          <Text className={`${isUser ? "text-white" : "text-black"} text-base`}>
            {message.text}
          </Text>
        </View>
      </View>

      {/* Thời gian gửi */}
      <Text
        className={`text-xs mt-1 ${isUser ? "text-blue-400 pr-2" : "text-gray-400 pl-10"
          }`}
      >
        {message.time}
      </Text>
    </View>
  );
});

/* -------------------------------------------------
   Component: ChatSuggestions
-------------------------------------------------- */
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

/* -------------------------------------------------
   Component: ChatInput
-------------------------------------------------- */
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

/* -------------------------------------------------
   Component chính: ChatBot
-------------------------------------------------- */
const ChatBot: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const flatRef = useRef<FlatList<Message>>(null);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const insets = useSafeAreaInsets();

  // Gợi ý mặc định
  const suggestions = useMemo(
    () => [
      "Có bãi đỗ nào gần tuyến Nguyễn Văn Linh không?",
      "Vào lúc 17h00, tuyến Trần Phú có cấm không?",
      "Có bãi đỗ nào gần quán cà phê ABC không?",
      "Các bãi đỗ còn trống gần khu vực trường Duy Tân",
      "Tình hình giao thông trên đường Lê Duẩn hiện tại thế nào?",
    ],
    []
  );

  // Ẩn tab bar
  useEffect(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
    return () => {
      navigation.getParent()?.setOptions({ tabBarStyle: DEFAULT_TAB_BAR_STYLE });
    };
  }, [navigation]);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      const height = e.endCoordinates.height;
      setKeyboardOffset(height * 0.35); // hoặc 1.0 nếu muốn trượt cao hơn một chút
    });

    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardOffset(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // helper
  const uid = useCallback(
    () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    []
  );

  const getCurrentTime = () =>
    new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  const pushMessage = useCallback((m: Message) => {
    setMessages((prev) => [...prev, m]);
  }, []);

  const simulateBotReply = useCallback((userText: string): string => {
    if (
      userText.toLowerCase().includes("bãi đỗ") ||
      userText.toLowerCase().includes("bãi")
    ) {
      return "Mình thấy có 2 bãi đỗ gần vị trí bạn hỏi: Bãi A (500m) và Bãi B (900m). Bạn muốn xem chi tiết tuyến đường đến bãi nào?";
    }
    if (
      userText.toLowerCase().includes("giao thông") ||
      userText.toLowerCase().includes("kẹt")
    ) {
      return "Hiện tại đường bạn hỏi có luồng giao thông khá ổn, tuy nhiên giờ cao điểm 17:00-19:00 có thể tắc nhẹ một vài đoạn.";
    }
    return "Cảm ơn bạn! Mình đã nhận được câu hỏi, đây là phản hồi mô phỏng.";
  }, []);

  // Nếu chưa đăng nhập
  if (!user) {
    return <NoUserLogin />;
  }

  const handleSend = useCallback(
    (text: string) => {
      const userMsg: Message = {
        id: uid(),
        from: "user",
        text,
        time: getCurrentTime(),
      };
      pushMessage(userMsg);

      // cuộn xuống
      setTimeout(
        () => flatRef.current?.scrollToOffset({ offset: 0, animated: true }),
        50
      );

      // mô phỏng bot trả lời
      setSending(true);
      setTimeout(() => {
        const botMsg: Message = {
          id: uid(),
          from: "bot",
          text: simulateBotReply(text),
          time: getCurrentTime(),
        };
        pushMessage(botMsg);
        setSending(false);
        setTimeout(
          () => flatRef.current?.scrollToOffset({ offset: 0, animated: true }),
          50
        );
      }, 800);
    },
    [uid, pushMessage, simulateBotReply]
  );

  const handleSelectSuggestion = useCallback(
    (text: string) => handleSend(text),
    [handleSend]
  );

  const renderItem: ListRenderItem<Message> = useCallback(
    ({ item }) => <ChatMessage message={item} />,
    []
  );

  const flatData = useMemo(() => [...messages].reverse(), [messages]);


  return (
    <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios"
          ? keyboardOffset + insets.bottom
          : keyboardOffset}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1">

            {/* Body */}
            <View className="flex-1 bg-white">
              {messages.length === 0 ? (
                <View className="flex-1">
                  <ChatSuggestions
                    suggestions={suggestions}
                    onSelect={handleSelectSuggestion}
                  />

                </View>
              ) : (
                <FlatList
                  ref={flatRef}
                  data={flatData}
                  keyExtractor={(item) => item.id}
                  renderItem={renderItem}
                  inverted
                  contentContainerStyle={{
                    padding: 12,
                    paddingBottom: 24,
                  }}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  removeClippedSubviews
                  initialNumToRender={20}
                  maxToRenderPerBatch={20}
                  windowSize={21}
                />
              )}
            </View>

            {/* Input */}
            <ChatInput onSend={handleSend} sending={sending} />
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatBot;
