import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  ListRenderItem,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import ChatSuggestions from "@/components/ChatSuggestions";
import { DEFAULT_TAB_BAR_STYLE } from "@/utils/tabBarStyle";
import { fetchHistoryChat, postChatMessage } from "@/service/api";
import { useAuth } from "@/app/context/AuthContext";
import BotTypingBubble from "@/components/BotTypingBubble";
import { useSmartMapboxLocation } from "@/hooks/usePeriodicMapboxLocation";

const ChatBot: React.FC = () => {
  const navigation = useNavigation<any>();
  const { accessToken } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [botTyping, setBotTyping] = useState(false);
  const [sessionID, setSessionID] = useState<string | null>(null);
  const flatRef = useRef<FlatList<ChatMessage>>(null);
  const insets = useSafeAreaInsets();
  const userLocation = useSmartMapboxLocation();

  //load session, lịch sử chat
  const loadSession = useCallback(async () => {
    try {
      const storedSession = await AsyncStorage.getItem("sessionID");
      if (!storedSession) {
        setLoading(false);
        return;
      }
      setSessionID(storedSession);

      //quá hạn session
      const history = await fetchHistoryChat(storedSession);
      console.log("Session expired", history?.session_info?.is_expired);
      if (history?.session_info?.is_expired) {

        await AsyncStorage.removeItem("sessionID");
        setSessionID(null);
      } else {
        setMessages(history.messages);
      }
    } catch (error) {
      console.error("Error loading session:", error);
      await AsyncStorage.removeItem("sessionID");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
    return () => {
      navigation.getParent()?.setOptions({ tabBarStyle: DEFAULT_TAB_BAR_STYLE });
    };
  }, [navigation]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const suggestions = useMemo(
    () => [
      "Có bãi đỗ nào gần tuyến Nguyễn Văn Linh không?",
      "Vào lúc 17h00, tuyến Trần Phú có cấm không?",
      "Có bãi đỗ nào gần bệnh viện Hoàn Mỹ không?",
      "Các bãi đỗ còn trống gần khu vực trường Duy Tân",
      "Tình hình giao thông trên đường Lê Duẩn hiện tại thế nào?",
    ],
    []
  );

  //Gửi tin nhắn
  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const currentTime = new Date().toISOString();

      // Thêm tin nhắn người dùng
      const userMsg: ChatMessage = {
        log_id: uid,
        user_query: text,
        llm_response: "",
        created_at: currentTime,
      };
      setMessages((prev) => [...prev, userMsg]);
      setBotTyping(true);
      setSending(true);

      try {
        const response = await postChatMessage(text, sessionID ?? undefined, userLocation ?? undefined, accessToken ?? undefined);

        // Lưu sessionID lần đầu
        if (!sessionID && response.session_id) {
          await AsyncStorage.setItem("sessionID", String(response.session_id));
          setSessionID(String(response.session_id));
        }

        // Thêm tin nhắn bot
        const botMsg: ChatMessage = {
          log_id: `${uid}-bot-${Date.now()}`,
          user_query: "",
          llm_response: response.response,
          created_at: new Date(response.timestamp).toISOString(),
        };
        setMessages((prev) => [...prev, botMsg]);
      } catch (err) {
        console.error("Error sending message:", err);
      } finally {
        setBotTyping(false);
        setSending(false);
        setTimeout(() => flatRef.current?.scrollToOffset({ offset: 0, animated: true }), 80);
      }
    },
    [sessionID]
  );

  // FlatList data
  const flatData = useMemo(() => [...messages].reverse(), [messages]);

  const renderItem: ListRenderItem<ChatMessage> = useCallback(
    ({ item }) => <ChatMessage message={item} />,
    []
  );

  // if (!user) return <NoUserLogin />;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.bottom : 104 + 15}
      >

        <View className="flex-1 bg-white">
          {loading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#007AFF" />
              <Text className="text-gray-500 mt-3">Đang tải hội thoại...</Text>
            </View>
          ) : messages.length === 0 && !botTyping ? (
            <ChatSuggestions suggestions={suggestions} onSelect={handleSend} />
          ) : (
            <>
              <FlatList
                ref={flatRef}
                data={flatData}
                keyExtractor={(item) => item.log_id}
                renderItem={renderItem}
                inverted
                contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
                showsVerticalScrollIndicator={false}
              />

              {botTyping && (
                <View className="px-4 pb-4">
                  <BotTypingBubble />
                </View>
              )}
            </>
          )}

          {/* Input */}
          <ChatInput onSend={handleSend} sending={sending} />
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatBot;
