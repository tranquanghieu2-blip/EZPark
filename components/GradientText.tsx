import React from "react";
import { View, Text } from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "react-native-linear-gradient";

export default function GradientText() {
    return (
        <MaskedView
            maskElement={
                <View
                    style={{
                        backgroundColor: "transparent",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <Text
                        style={{
                            fontSize: 60,
                            fontWeight: "bold",
                            color: "black", // chỉ dùng để tạo alpha cho mask
                        }}
                    >
                        EZPark
                    </Text>
                </View>
            }
        >
            <LinearGradient
                colors={["#f87171", "#fb923c"]}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
                style={{ flex: 1 }}
            >
                <Text
                    style={{
                        fontSize: 60,
                        fontWeight: "bold",
                        opacity: 0, // text ẩn đi, chỉ lấy layout
                    }}
                >
                    EZPark
                </Text>
            </LinearGradient>
        </MaskedView>
    );
}
