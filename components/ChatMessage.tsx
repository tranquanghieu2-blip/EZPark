import React from "react";
import { View, Text, Image, Pressable } from "react-native";
import { images } from "@/constants/images";
import { formatMessageTime } from "@/utils/formatMessageTime";
import { mapEvents, EVENT_OPEN_SPOT } from "@/utils/eventEmitter";
import { useNavigation } from "@react-navigation/native";


interface ChatMessageProps {
  message: ChatMessage;
}

// Helper function to parse text and replace parking spot names with clickable components
const parseTextWithParkingSpots = (
  text: string,
  parkingSpots: ParkingSpotDetail[] | undefined,
  isUser: boolean,
  onParkingSpotPress: (spotId: number) => void
) => {
  if (!parkingSpots || parkingSpots.length === 0) {
    return <Text className={`${isUser ? "text-white" : "text-black"} text-base`}>{text}</Text>;
  }

  // Create a map of parking spot IDs by name for quick lookup
  const spotMap = new Map<string, number>();
  parkingSpots.forEach(spot => {
    if (spot.name) {
      spotMap.set(spot.name, spot.parking_spot_id);
    }
  });

  // Build regex pattern to match any parking spot name
  const spotNames = Array.from(spotMap.keys());
  if (spotNames.length === 0) {
    return <Text className={`${isUser ? "text-white" : "text-black"} text-base`}>{text}</Text>;
  }

  // Escape special regex characters and sort by length (longest first to avoid partial matches)
  const sortedNames = spotNames
    .map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .sort((a, b) => b.length - a.length);

  const pattern = new RegExp(`(${sortedNames.join('|')})`, 'gi');
  const parts = text.split(pattern);

  return (
    <Text className={`${isUser ? "text-white" : "text-black"} text-base`}>
      {parts.map((part, index) => {
        // Check if this part matches a parking spot name (case-insensitive)
        const matchedSpot = spotNames.find(
          name => name.toLowerCase() === part.toLowerCase()
        );

        if (matchedSpot) {
          const spotId = spotMap.get(matchedSpot);
          return (
            <Text
              key={index}
              className={`${isUser ? "text-white" : "text-blue-600"} text-base font-bold underline`}
              onPress={() => {
                if (spotId) {
                  onParkingSpotPress(spotId);
                }
              }}
            >
              {part}
            </Text>
          );
        }

        return <Text key={index}>{part}</Text>;
      })}
    </Text>
  );
};

// Component hiển thị 1 bong bóng tin nhắn
const MessageBubble = ({
  isUser,
  text,
  created_at,
  parkingSpots,
  onParkingSpotPress,
}: {
  isUser: boolean;
  text: string;
  created_at: string;
  intent?: string;
  search_method?: string;
  parkingSpots?: ParkingSpotDetail[];
  onParkingSpotPress: (spotId: number) => void;
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
        className={`max-w-[80%] px-4 py-2 rounded-2xl ${isUser
          ? "bg-blue-600 rounded-br-none"
          : "bg-gray-200 rounded-tl-none"
          }`}
      >
        {parseTextWithParkingSpots(text, parkingSpots, isUser, onParkingSpotPress)}
      </View>
    </View>

    {/* Thời gian */}
    <Text
      className={`text-xs mt-1 ${isUser ? "text-blue-400 pr-2" : "text-gray-400 pl-10"
        }`}
    >
      {formatMessageTime(created_at)}
    </Text>
  </View>
);

// Component chính hiển thị cả 2 chiều chat (user + bot)
const ChatMessage: React.FC<ChatMessageProps> = React.memo(({ message }) => {
  const navigation = useNavigation<any>();

  const handleParkingSpotPress = (spotId: number) => {
    // Navigate to ParkingSpot tab (index tab)
    // navigation.navigate("index");

    navigation.reset({
      index: 0,
      routes: [
        {
          name: "Tabs",
          state: {
            routes: [
              {
                name: "ParkingSpot",
                params: {
                  openSpotId: spotId,
                },
              },
            ],
          },
        },
      ],
    });



  };

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
          parkingSpots={message.parking_spots}
          onParkingSpotPress={handleParkingSpotPress}
        />
      )}

      {/* Tin nhắn user */}
      {message.user_query && (
        <MessageBubble
          isUser
          text={message.user_query}
          created_at={message.created_at}
          onParkingSpotPress={handleParkingSpotPress}
        />
      )}


    </>
  );
});

export default ChatMessage;
