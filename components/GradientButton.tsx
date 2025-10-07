// GradientButton.tsx
import { LinearGradient } from "react-native-linear-gradient";
import React from "react";
import { TouchableOpacity, ViewStyle } from "react-native";

type GradientButtonProps = {
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
  style?: ViewStyle;
  disabled ?: boolean;
};

const GradientButton = ({ children, onPress, className, style, disabled }: GradientButtonProps) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} className="flex-1" disabled={disabled}>
      <LinearGradient
        colors={["#f87171", "#fb923c"]}
        start={{ x: 0, y:  0}}
        end={{ x: 1, y: 1 }}
        className={` ${className ?? ""}`}

        style={[{ borderRadius: 8 }, style]}
      >
        {children}
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default GradientButton;
