import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from "react-native";
import { FontAwesome } from "@react-native-vector-icons/fontawesome";
import { Toast } from "toastify-react-native";

const COLORS = {
  success: "#4CAF50",
  error: "#F44336",
  warning: "#FF9800",
  info: "#2196F3",
} as const;

const ICONS = {
  success: "check-circle",
  error: "times-circle",
  warning: "exclamation-circle",
  info: "info-circle",
} as const;

interface Props {
  text1: string;
  text2?: string;
  type?: keyof typeof COLORS;
  visibilityTime?: number;
}

export const ToastCustomView: React.FC<Props> = ({
  text1,
  text2,
  type = "info",
  visibilityTime = 2000,
}) => {
  const color = COLORS[type];
  const icon = ICONS[type];
  const progress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 0,
      duration: visibilityTime,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [visibilityTime]);

  const widthInterpolate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={[styles.container, { backgroundColor: color }]}>
      {/* Icon loại toast */}
      <FontAwesome name={icon as any} size={22} color="#fff" style={{ marginRight: 10 }} />

      {/* Nội dung */}
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={styles.title}>
          {text1}
        </Text>
        {text2 ? (
          <Text numberOfLines={2} style={styles.message}>
            {text2}
          </Text>
        ) : null}

        {/* Thanh progress bar */}
        <Animated.View
          style={[
            styles.progressBar,
            { backgroundColor: "rgba(255,255,255,1)", width: widthInterpolate },
          ]}
        />
      </View>

      {/* Nút close */}
      <TouchableOpacity onPress={() => Toast.hide()} style={styles.closeButton}>
        <FontAwesome name="times" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginHorizontal: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  message: {
    color: "#fff",
    fontSize: 14,
    marginTop: 2,
    opacity: 0.95,
  },
  progressBar: {
    height: 3,
    borderRadius: 2,
    marginTop: 6,
  },
  closeButton: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});
