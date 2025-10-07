import { LinearGradient } from "react-native-linear-gradient";
import React from "react";
import { ViewStyle } from "react-native";

interface GradientWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle | string; // hỗ trợ cả tailwind
}

const GradientWrapper: React.FC<GradientWrapperProps> = ({ children, style }) => {
  return (
    <LinearGradient
      colors={["#f87171", "#fb923c"]}
      start={{ x: 0, y: 1 }}
      end={{ x: 1, y: 0 }}
      className={`justify-center ${typeof style === "string" ? style : ""}`}
      style={typeof style !== "string" ? style : undefined}
    >
      {children}
    </LinearGradient>
  );
};

export default GradientWrapper;
