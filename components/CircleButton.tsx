// CircleButton.tsx
import React from 'react'
import { TouchableOpacity, ViewStyle } from 'react-native'

interface Props {
  icon: React.ReactNode
  bgColor?: string
  onPress?: () => void
  size?: number
  style?: ViewStyle
}

const CircleButton = ({ icon, bgColor = '#ab8bff', onPress, size = 50, style }: Props) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="justify-center items-center rounded-full border border-gray-200 shadow-2xl"
      style={[
        {
          width: size,
          height: size,
          backgroundColor: bgColor
        },
        style
      ]}
    >
      {icon}
    </TouchableOpacity>

  )
}

export default CircleButton
