import React from "react";
import { Modal, View, Text, Pressable, Image } from "react-native";
import { icons } from "@/constants/icons";

interface MessageModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: "success" | "error" | "info";
}

const MessageModal: React.FC<MessageModalProps> = ({
    visible,
    onClose,
    title,
    message,
    type = "info",
}) => {
    // Chọn icon theo type
    const renderIcon = () => {
        switch (type) {
            case "success":
                return <Image source={icons.iconSuccess} style={{ width: 40, height: 40 }} />; // xanh lá
            case "error":
                return <Image source={icons.iconError} style={{ width: 40, height: 40 }} />; // đỏ
            case "info":
            default:
                return <Image />; // cam
        }
    };
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/50 justify-center items-center">
                <View className="bg-white w-4/5 p-6 rounded-2xl items-center">
                    {/* Icon */}
                    {renderIcon()}
                    <Text className="text-lg font-semibold my-2 text-red-600 ">
                        {title}
                    </Text>
                    <Text className="text-center mb-5">{message}</Text>
                    <Pressable
                        onPress={onClose}
                        className="bg-gray-200 px-6 py-2 rounded-lg w-full items-center h-[40px] justify-center"
                    >
                        <Text className="text-black font-semibold">Đóng</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
};

export default MessageModal;
