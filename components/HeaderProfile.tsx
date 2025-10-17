import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface HeaderProfileProps {
  curveRatio?: number; // Tỉ lệ phần cong (vd: 0.25 = 1/4 chiều cao)
}

const { width: screenWidth, height: screenHeight } = Dimensions.get("screen");

const HeaderProfile: React.FC<HeaderProfileProps> = ({ curveRatio = 0.15 }) => {
  const insets = useSafeAreaInsets();

  // ✅ Chiều cao chiếm 30% màn hình + phần status bar
  const height = screenHeight * 0.25 + insets.top;

  // Phần cong tính theo tỉ lệ
  const curveHeight = height * curveRatio;
  const flatHeight = height - curveHeight;

  // ✅ Đường cong linh hoạt theo kích thước màn hình
  const d = `M0,0 
             H${screenWidth} 
             V${flatHeight} 
             C${screenWidth * 0.75},${flatHeight + curveHeight * 1.2} 
              ${screenWidth * 0.25},${flatHeight + curveHeight * 1.2} 
              0,${flatHeight} 
             Z`;

  return (
    <View style={[styles.container, { height }]}>
      <Svg height="100%" width="100%" viewBox={`0 0 ${screenWidth} ${height}`}>
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#f87171" />
            <Stop offset="1" stopColor="#fb923c" /> 
          </LinearGradient>
        </Defs>

        <Path d={d} fill="url(#grad)" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    position: "absolute", // Dính lên đầu màn hình
    top: 0,
    left: 0,
    overflow: "hidden",
  },
});

export default HeaderProfile;
