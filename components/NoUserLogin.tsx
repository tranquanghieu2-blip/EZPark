import { View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
const NoUserLogin = () => {
    const navigation = useNavigation<any>();
    return (
        <View className="flex-1 justify-center items-center bg-white px-6">
            <Text className="mb-4 text-lg text-center text-gray-700">
                Vui lòng đăng nhập để sử dụng chức năng này
            </Text>
            <Pressable
                onPress={() => navigation.navigate("auth", { screen: "login" })}
                className="px-5 py-3 bg-blue-500 rounded-lg"
            >
                <Text className="text-white font-semibold">Đăng nhập</Text>
            </Pressable>
        </View>
    );
};

export default NoUserLogin;