
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { FontAwesome } from "@react-native-vector-icons/fontawesome";

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
export const ToastCustomView: React.FC<any> = ({ text1, text2, type }) => {
  const color = COLORS[type as keyof typeof COLORS] ?? COLORS.info;
  const icon = ICONS[type as keyof typeof ICONS] ?? ICONS.info;

  return (
    <View style={[styles.container, { backgroundColor: color }]}>
      <FontAwesome name={icon as any} size={24} color="#fff" style={{ marginRight: 10 }} />
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={styles.title}>
          {text1}
        </Text>
        {text2 ? (
          <Text numberOfLines={2} style={styles.message}>
            {text2}
          </Text>
        ) : null}
      </View>
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
});
