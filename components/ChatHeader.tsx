import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useNavigation } from "@react-navigation/native";
import { IconVolumeHigh } from "./Icons";

const ChatHeader = () => {
    const navigation = useNavigation();

    return (
        <View className="flex-row items-center justify-between bg-white h-[80px] px-3 border-b border-gray-200" style={{
            elevation: 4, // đổ bóng Android
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 3,
        }}>
            {/* Nút back */}
            <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>

            <View className="flex-row items-center space-x-2 gap-3">
                <Image
                    source={require("../assets/images/chatbot.png")} // ảnh logo
                    className="w-[30px] h-[30px] rounded-full border-2 border-blue-600"
                />
                <View>
                    <Text className="text-blue-600 text-xl font-bold">EZChat</Text>
                    <Text className="text-green-600 text-sm">● Online</Text>
                </View>
            </View>

            <TouchableOpacity onPress={() => alert("Âm thanh!")}>
                <IconVolumeHigh size={24} color="black" />
            </TouchableOpacity>
        </View>
    );
};

export default ChatHeader;
